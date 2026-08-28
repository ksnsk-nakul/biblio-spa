import { googleRedirectUrl } from '../api/auth'

export default function GoogleButton() {
  return (
    <a className="btn btn-google" href={googleRedirectUrl()}>
      Continue with Google
    </a>
  )
}
