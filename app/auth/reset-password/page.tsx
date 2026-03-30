
import { Loader2Icon } from 'lucide-react'
import React, { Suspense } from 'react'
import ResetPasswordPage from '../admin/_component/reset-password'


const page = () => {
  return (
    <Suspense fallback={<Loader2Icon className=' animate-spin size-4'/>}>
      <ResetPasswordPage/>
    </Suspense>
  )
}

export default page