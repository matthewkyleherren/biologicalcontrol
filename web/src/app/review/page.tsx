import {redirect} from 'next/navigation'

/** Story review now lives in the admin section. */
export default function ReviewPage() {
  redirect('/admin?tab=stories')
}
