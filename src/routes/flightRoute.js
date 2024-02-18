const router = require('express').Router();
const { isAuth } = require('../../middleware/Auth');
const flightController = require('../controllers/flightController')
 
router.get('/', flightController.getAllFlights)
router.get('/:id', flightController.getFlight)
// router.get('/search/:key', flightController.searchFlight)
router.post("/create-post", isAuth,flightController.createFlight);
router.delete('/:id', flightController.deleteFlight)
// to be used when you want all flights createBy a specific user
router.get('/user/:id', flightController.getFlightByUserId)

module.exports = router  