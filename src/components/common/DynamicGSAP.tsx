'use client'

import dynamic from 'next/dynamic'

const GSAPWrapper = dynamic(() => import('./GSAPAnimations'), {
  ssr: false,
  loading: () => null
})

export default GSAPWrapper 