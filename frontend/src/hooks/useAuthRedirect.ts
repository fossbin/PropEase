'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function useAuthRedirect() {
  const router = useRouter()

  useEffect(() => {
    const userId = sessionStorage.getItem("userId")
    if (!userId) {
      router.replace("/auth/login") 
    }
  }, [])
}
