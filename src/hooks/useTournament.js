import { useCallback, useEffect, useRef, useState } from 'react'
import { db } from '../lib/db'

/** Carrega um torneio completo e mantém-no atualizado em tempo real. */
export function useTournamentData(tid) {
  const [state, setState] = useState({ loading: true, error: null, data: null })
  const alive = useRef(true)

  const load = useCallback(async () => {
    try {
      const data = await db.loadAll(tid)
      if (alive.current) setState({ loading: false, error: null, data })
    } catch (error) {
      if (alive.current) setState((s) => ({ ...s, loading: false, error }))
    }
  }, [tid])

  useEffect(() => {
    alive.current = true
    setState({ loading: true, error: null, data: null })
    load()
    let timer
    const schedule = () => {
      clearTimeout(timer)
      timer = setTimeout(load, 200)
    }
    const unsub = db.subscribe(tid, schedule)
    // Rede de segurança: ecrãs que adormecem ou perdem a ligação voltam a sincronizar.
    const onVisible = () => document.visibilityState === 'visible' && schedule()
    document.addEventListener('visibilitychange', onVisible)
    const poll = setInterval(load, 60000)
    return () => {
      alive.current = false
      clearTimeout(timer)
      clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisible)
      unsub()
    }
  }, [tid, load])

  return { ...state, reload: load }
}

export function useAuth() {
  const [user, setUser] = useState(undefined)
  useEffect(() => {
    let on = true
    db.auth.getUser().then((u) => on && setUser(u))
    const off = db.auth.onChange((u) => setUser(u))
    return () => {
      on = false
      off()
    }
  }, [])
  return user
}
