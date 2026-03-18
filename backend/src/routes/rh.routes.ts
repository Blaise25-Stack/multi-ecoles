import { Router } from 'express'
import enseignantsRoutes from './enseignants.routes'
import personnelRoutes from './personnel.routes'
import presencesRoutes from './presences.routes'
import congesRoutes from './conges.routes'
import salairesRoutes from './salaires.routes'

const router = Router()

router.use('/enseignants', enseignantsRoutes)
router.use('/personnel', personnelRoutes)
router.use('/presences', presencesRoutes)
router.use('/conges', congesRoutes)
router.use('/salaires', salairesRoutes)

export default router
