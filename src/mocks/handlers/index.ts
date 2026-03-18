import { authHandlers } from './auth'
import { eleveHandlers } from './eleves'
import { comptabiliteHandlers } from './comptabilite'
import { rhHandlers } from './rh'
import { configHandlers } from './config'

export const handlers = [
  ...authHandlers,
  ...eleveHandlers,
  ...comptabiliteHandlers,
  ...rhHandlers,
  ...configHandlers,
]



