import { Web3Storage, getFilesFromPath } from 'web3.storage'

export const UploadFile = async (selectedFile: any, fileName: any) => {
  console.log('uploding your file...')
  console.log('selectedFile:', selectedFile)
  console.log('fileName:', fileName)

  function getAccessToken() {
    return process.env.NEXT_PUBLIC_WEB3STORAGE_TOKEN
  }

  function makeStorageClient() {
    return new Web3Storage({ token: getAccessToken() || '' })
  }

  async function getFiles(file: any) {
    const File = await getFilesFromPath(file)
    return File
  }

  async function storeFile(files: any) {
    try {
      const client = makeStorageClient()
      const put = await client.put([files])
      return put
    } catch (error) {
      console.error('error (storeFile):', error)
      return null
    }
  }

  let cid = null
  try {
    cid = await storeFile(selectedFile)
  } catch (error) {
    console.error('upload error:', error)
  }

  console.log('cid:', cid)
  console.log('uri:', 'https://' + cid + '.ipfs.w3s.link' + '/' + fileName)
  if (cid === null) {
    return 'https://bafybeihuyvg2e7vpsui6t4fqbnko35n44nogkjjx4wprh5bu3j2lkrqtym.ipfs.w3s.link/project-banner.jpg'
  } else {
    return 'https://' + cid + '.ipfs.w3s.link' + '/' + fileName
  }
}
