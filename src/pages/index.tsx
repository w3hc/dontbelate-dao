import { Heading, Button, Badge, Flex, useToast, Link } from '@chakra-ui/react'
import { AddIcon } from '@chakra-ui/icons'
import { Head } from 'components/layout/Head'
import { HeadingComponent } from 'components/layout/HeadingComponent'
import { LinkComponent } from 'components/layout/LinkComponent'
import { useState, useEffect, useCallback } from 'react'
import { useAccount, useNetwork, useWalletClient, useSwitchNetwork } from 'wagmi'
import { ethers, EventLog, Log } from 'ethers'
import { NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI } from '../utils/nft'
import { useEthersSigner, useEthersProvider } from '../hooks/ethersAdapter'
import { GOV_CONTRACT_ADDRESS, GOV_CONTRACT_ABI, nftAbi } from '../utils/config'
// import { createConfig, configureChains, mainnet } from '@wagmi/core'
// import { publicProvider } from '@wagmi/core/providers/public'

export default function Home() {
  const { isConnected } = useAccount()
  const { data: walletClient, isError } = useWalletClient()
  const toast = useToast()
  const { chain } = useNetwork()
  const { chains, error, isLoading, pendingChainId, switchNetwork } = useSwitchNetwork()
  const { address, isConnecting, isDisconnected } = useAccount()
  // const { publicClient } = configureChains([mainnet], [publicProvider()])
  // const config = createConfig({
  //   publicClient,
  // })
  const provider = useEthersProvider()
  const signer = useEthersSigner()

  const [loading, setLoading] = useState<boolean>(false)
  // const [signer, setSigner] = useState<any>()
  // const [provider, setProvider] = useState<any>()
  const [txLink, setTxLink] = useState<string>()
  const [txHash, setTxHash] = useState<string>()
  const [name, setName] = useState<string>('')
  const [block, setBlock] = useState(0)
  const [manifesto, setManifesto] = useState('')
  const [manifestoLink, setManifestoLink] = useState('')
  const [proposal, setProposal] = useState<{ id: string; link: string; title: string; state: number }[]>([
    {
      id: '12345678',
      link: 'http://link.com',
      title: '',
      state: 0,
    },
  ])
  const [initialized, setInitialized] = useState(false)
  const stateText = ['Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed']
  const stateColor = ['orange', 'green', 'blue', 'red', 'purple', 'blue', 'blue', 'blue']
  const [isMember, setIsMember] = useState(false)

  const baseUrl = '/proposal/'

  const gov = new ethers.Contract(GOV_CONTRACT_ADDRESS, GOV_CONTRACT_ABI, provider)

  useEffect(() => {
    const init = async () => {
      console.log('isConnected:', isConnected)
      if (chain?.id !== 10243) {
        switchNetwork?.(10243)
      }
      console.log("what's my name:", await gov.name())
    }
    init()
  }, [])

  const getName = useCallback(async () => {
    const name = await gov.name()
    if (name === '') {
      setName('unset')
    } else {
      setName(name)
    }
  }, [])

  const getBlock = useCallback(async () => {
    const blockNumber = await provider.getBlockNumber()
    setBlock(blockNumber)
  }, [])

  const getManifesto = useCallback(async () => {
    const manifestoCall = await gov.manifesto()
    console.log('manifestoCall:', manifestoCall)
    if (manifestoCall === '') {
      setManifesto('[unset]')
      setManifestoLink('https://bafybeihmgfg2gmm23ozur3ylmkxgwkyr5dlpruivv3wjeujrdktxihqe3a.ipfs.w3s.link/manifesto.md')
    } else {
      setManifesto(manifestoCall)
      setManifestoLink('https://' + manifestoCall + '.ipfs.w3s.link/manifesto.md')
    }
  }, [])

  const getState = async (proposalId: any) => {
    return await gov.state(proposalId)
  }

  const getProposals = useCallback(async () => {
    console.log('getProposals started')
    if (block > 1) {
      console.log('if (block > 1)')

      const proposals: any = await gov.queryFilter('ProposalCreated' as any, 95771, block) // TODO: fix type casting

      try {
        let i: number = 0
        let proposalsRaw = proposal

        console.log('proposals:', proposals[0]) // https://github.com/ethers-io/ethers.js/issues/487#issuecomment-1722195086

        // console.log((<EventLog>proposals[0]).args)

        // if (“args” in proposals[0]) { console.log(proposals[0]).args; }

        if (proposals[0].args != undefined) {
          for (i = 0; i < Number(proposals.length); i++) {
            proposalsRaw.push(
              ...[
                {
                  id: String(proposals[i].args?.proposalId),
                  link: baseUrl + String(proposals[i].args?.proposalId),
                  title: proposals[i].args[8].substring(proposals[i].args[8][0] == '#' ? 2 : 0, proposals[i].args[8].indexOf('\n')),
                  state: await getState(proposals[i].args?.proposalId),
                },
              ]
            )
          }
          delete proposal[0]
          setProposal(proposalsRaw)
          setInitialized(true)
        }
      } catch (error) {
        console.log('error:', error)
      }
    }
  }, [block])

  const checkMembership = async () => {
    try {
      const userAddress = await signer?.getAddress()
      console.log('userAddress:', userAddress)

      const gov = new ethers.Contract(GOV_CONTRACT_ADDRESS, GOV_CONTRACT_ABI, provider)
      const dontbelate = new ethers.Contract(await gov.token(), nftAbi, provider)
      const call3 = await dontbelate.balanceOf(userAddress)
      console.log('dontbelate:', Number(call3))
      if (Number(call3) == 1) {
        setIsMember(true)
      } else {
        setIsMember(false)
      }
    } catch (e) {
      console.log('error:', e)
    }
  }

  useEffect(() => {
    getProposals()
  }, [getProposals])

  useEffect(() => {
    checkMembership()
  }, [signer])

  useEffect(() => {
    console.log('chain', chain)
    if (chain !== undefined) {
      console.log('chain !== undefined')
      getBlock()
      getName()
      getManifesto()
    }
  }, [chain, getBlock, getName, getManifesto])

  function Item(props: any) {
    return (
      <>
        <div className="">
          <div>
            <strong>
              <Link style={{ color: '#45a2f8' }} target="blank" href={props.link}>
                {props.title}
                {/* {props.title ? props.title : 'yo'} */}
              </Link>
            </strong>{' '}
            <Badge ml="1" fontSize="0.5em" colorScheme={stateColor[props.state]} variant="solid">
              {stateText[props.state]}
            </Badge>
          </div>
        </div>
      </>
    )
  }

  function List() {
    return (
      <div>
        {initialized === true ? proposal.map((p) => <Item key={p.id} title={p.title} state={p.state} id={p.id} link={p.link} />) : 'loading...'}
      </div>
    )
  }

  return (
    <>
      <Head />

      <main>
        <>
          <Heading as="h2">{name}</Heading>
        </>
        <br />

        {isDisconnected || !initialized ? (
          <>
            <br />
            {isDisconnected ? <p>Please connect your wallet.</p> : 'loading...'}
          </>
        ) : (
          <>
            <p>
              DAO contract address:{' '}
              <strong>
                <a
                  style={{ color: '#45a2f8' }}
                  target="_blank"
                  rel="noopener noreferrer"
                  // href={'https://goerli.arbiscan.io/address/' + GOV_CONTRACT_ADDRESS + '#code'}>
                  href={'https://explorer-test.arthera.net/address/' + GOV_CONTRACT_ADDRESS}>
                  {GOV_CONTRACT_ADDRESS}
                </a>
              </strong>
            </p>
            {/* <p>
              Manifesto:{' '}
              <strong>
                <a style={{ color: '#45a2f8' }} target="_blank" rel="noopener noreferrer" href={manifestoLink}>
                  {manifesto}
                </a>
              </strong>
            </p> */}
            <br />
            <List />
            <br />{' '}
            <Flex as="header" py={5} mb={8} alignItems="center">
              <LinkComponent href="/push">
                <Button rightIcon={<AddIcon />} colorScheme="green" variant="outline">
                  New proposal
                </Button>
                <br />
              </LinkComponent>
              {isMember === false && (
                <LinkComponent href="/join">
                  <Button ml={5} colorScheme="blue" variant="outline">
                    Become a member
                  </Button>
                  <br />
                </LinkComponent>
              )}
            </Flex>
          </>
        )}
      </main>
    </>
  )
}
