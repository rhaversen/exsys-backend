// Node.js built-in modules

// Third-party libraries
import { expect } from 'chai'
import { describe, it } from 'mocha'
import { chaiAppServer as agent } from '../../testSetup.js'
import sinon from 'sinon'

// Own modules
import OrderModel from '../../../app/models/Order.js'
import ProductModel, { type IProduct } from '../../../app/models/Product.js'
import RoomModel, { type IRoom } from '../../../app/models/Room.js'
import OptionModel, { type IOption } from '../../../app/models/Option.js'

describe('POST /v1/orders', function () {
	let testProduct1: IProduct
	let testRoom: IRoom
	let testOption1: IOption

	beforeEach(async function () {
		testProduct1 = await ProductModel.create({
			name: 'Test Product',
			price: 100,
			description: 'A test product',
			orderWindow: {
				from: {
					hour: 0,
					minute: 0
				},
				to: {
					hour: 23,
					minute: 59
				}
			}
		})

		testRoom = await RoomModel.create({
			name: 'Test Room',
			description: 'A test room'
		})

		testOption1 = await OptionModel.create({
			name: 'Test Option',
			price: 50,
			description: 'A test option'
		})
	})

	it('should create a valid order', async function () {
		await agent.post('/v1/orders').send({
			roomId: testRoom.id,
			products: [{
				id: testProduct1.id,
				quantity: 1
			}],
			options: [{
				id: testOption1.id,
				quantity: 1
			}]
		})

		const order = await OrderModel.findOne({})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(order).to.exist
		expect(order?.roomId.toString()).to.equal(testRoom.id)
		expect(order?.products[0].id.toString()).to.equal(testProduct1.id)
		expect(order?.products[0].quantity).to.equal(1)
		expect(order?.options?.[0].id.toString()).to.equal(testOption1.id)
		expect(order?.options?.[0].quantity).to.equal(1)
	})

	it('should return the order', async function () {
		const res = await agent.post('/v1/orders').send({
			roomId: testRoom.id,
			products: [{
				id: testProduct1.id,
				quantity: 1
			}],
			options: [{
				id: testOption1.id,
				quantity: 1
			}]
		})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(res.body).to.exist
		expect(res.body.roomId.toString()).to.equal(testRoom.id)
		expect(res.body.products[0].id).to.equal(testProduct1.id)
		expect(res.body.products[0].quantity).to.equal(1)
		expect(res.body.options?.[0].id).to.equal(testOption1.id)
		expect(res.body.options?.[0].quantity).to.equal(1)
	})

	it('should handle orders with undefined options', async function () {
		await agent.post('/v1/orders').send({
			roomId: testRoom.id,
			products: [{
				id: testProduct1.id,
				quantity: 1
			}]
		})
		const order = await OrderModel.findOne({})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(order).to.exist
	})

	it('should handle orders with undefined products', async function () {
		await agent.post('/v1/orders').send({
			roomId: testRoom.id,
			options: [{
				id: testOption1.id,
				quantity: 1
			}]
		})
		const order = await OrderModel.findOne({})
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(order).to.not.exist
	})

	describe('Quantity validation', function () {
		describe('Product', function () {
			let testProduct2: IProduct

			beforeEach(async function () {
				testProduct2 = await ProductModel.create({
					name: 'Test Product1',
					price: 100,
					description: 'A test product',
					orderWindow: {
						from: {
							hour: 0,
							minute: 0
						},
						to: {
							hour: 23,
							minute: 59
						}
					}
				})
			})

			it('should create a order with a product with quantity 0 and product with quantity 1', async function () {
				await agent.post('/v1/orders').send({
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 0
					},
					{
						id: testProduct2.id,
						quantity: 1
					}]
				})
				const order = await OrderModel.findOne({})
				// eslint-disable-next-line @typescript-eslint/no-unused-expressions
				expect(order).to.exist
			})

			it('should remove products with quantity 0', async function () {
				await agent.post('/v1/orders').send({
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 0
					},
					{
						id: testProduct2.id,
						quantity: 1
					}]
				})
				const order = await OrderModel.findOne({})
				expect(order?.products.length).to.equal(1)
			})

			it('should combine products with the same product id', async function () {
				await agent.post('/v1/orders').send({
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					},
					{
						id: testProduct1.id,
						quantity: 1
					}]
				})
				const order = await OrderModel.findOne({})
				expect(order?.products[0].quantity).to.equal(2)
			})

			it('should handle two duplicate and a unique products', async function () {
				await agent.post('/v1/orders').send({
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 2
					},
					{
						id: testProduct1.id,
						quantity: 1
					},
					{
						id: testProduct2.id,
						quantity: 1
					}]
				})
				const order = await OrderModel.findOne({})
				expect(order?.products.length).to.equal(2)
				expect(order?.products[0].quantity).to.equal(3)
				expect(order?.products[1].quantity).to.equal(1)
			})

			it('should handle unique products with different quantities', async function () {
				await agent.post('/v1/orders').send({
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					},
					{
						id: testProduct2.id,
						quantity: 2
					}]
				})
				const order = await OrderModel.findOne({})
				expect(order?.products.length).to.equal(2)
				expect(order?.products[0].quantity).to.equal(1)
				expect(order?.products[1].quantity).to.equal(2)
			})

			it('should handle products with quantity 0 and products with quantity 1', async function () {
				await agent.post('/v1/orders').send({
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					},
					{
						id: testProduct2.id,
						quantity: 0
					}]
				})
				const order = await OrderModel.findOne({})
				expect(order?.products.length).to.equal(1)
				expect(order?.products[0].quantity).to.equal(1)
			})

			it('should handle products with quantity 1 and products with undefined quantity', async function () {
				await agent.post('/v1/orders').send({
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					},
					{
						id: testProduct2.id
					}]
				})
				const order = await OrderModel.findOne({})
				expect(order?.products.length).to.equal(1)
				expect(order?.products[0].quantity).to.equal(1)
			})
		})

		describe('Option', function () {
			let testOption2: IOption

			beforeEach(async function () {
				testOption2 = await OptionModel.create({
					name: 'Test Option1',
					price: 50,
					description: 'A test option'
				})
			})

			it('should create a order with a option with quantity 0 and option with quantity 1', async function () {
				await agent.post('/v1/orders').send({
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					}],
					options: [{
						id: testOption1.id,
						quantity: 0
					},
					{
						id: testOption2.id,
						quantity: 1
					}]
				})
				const order = await OrderModel.findOne({})
				// eslint-disable-next-line @typescript-eslint/no-unused-expressions
				expect(order).to.exist
			})

			it('should create a order with a option with quantity 0', async function () {
				await agent.post('/v1/orders').send({
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					}],
					options: [{
						id: testOption1.id,
						quantity: 0
					}]
				})
				const order = await OrderModel.findOne({})
				// eslint-disable-next-line @typescript-eslint/no-unused-expressions
				expect(order).to.exist
			})

			it('should remove option with quantity 0', async function () {
				await agent.post('/v1/orders').send({
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					}],
					options: [{
						id: testOption1.id,
						quantity: 0
					}]
				})
				const order = await OrderModel.findOne({})
				expect(order?.options?.length).to.equal(0)
			})

			it('should remove options with quantity 0', async function () {
				await agent.post('/v1/orders').send({
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					}],
					options: [{
						id: testOption1.id,
						quantity: 0
					},
					{
						id: testOption2.id,
						quantity: 1
					}]
				})
				const order = await OrderModel.findOne({})
				expect(order?.options?.length).to.equal(1)
			})

			it('should combine options with the same option id', async function () {
				await agent.post('/v1/orders').send({
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					}],
					options: [{
						id: testOption1.id,
						quantity: 1
					},
					{
						id: testOption1.id,
						quantity: 1
					}]
				})
				const order = await OrderModel.findOne({})
				expect(order?.options?.[0].quantity).to.equal(2)
			})

			it('should handle two duplicate options with different quantities', async function () {
				await agent.post('/v1/orders').send({
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					}],
					options: [{
						id: testOption1.id,
						quantity: 2
					},
					{
						id: testOption1.id,
						quantity: 1
					}]
				})
				const order = await OrderModel.findOne({})
				expect(order?.options?.[0].quantity).to.equal(3)
			})

			it('should handle two duplicate and a unique option', async function () {
				await agent.post('/v1/orders').send({
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					}],
					options: [{
						id: testOption1.id,
						quantity: 2
					},
					{
						id: testOption1.id,
						quantity: 1
					},
					{
						id: testOption2.id,
						quantity: 1
					}]
				})
				const order = await OrderModel.findOne({})
				expect(order?.options?.length).to.equal(2)
				expect(order?.options?.[0].quantity).to.equal(3)
				expect(order?.options?.[1].quantity).to.equal(1)
			})

			it('should handle unique options with different quantities', async function () {
				await agent.post('/v1/orders').send({
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					}],
					options: [{
						id: testOption1.id,
						quantity: 1
					},
					{
						id: testOption2.id,
						quantity: 2
					}]
				})
				const order = await OrderModel.findOne({})
				expect(order?.options?.length).to.equal(2)
				expect(order?.options?.[0].quantity).to.equal(1)
				expect(order?.options?.[1].quantity).to.equal(2)
			})

			it('should handle options with quantity 0 and options with quantity 1', async function () {
				await agent.post('/v1/orders').send({
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					}],
					options: [{
						id: testOption1.id,
						quantity: 1
					},
					{
						id: testOption2.id,
						quantity: 0
					}]
				})
				const order = await OrderModel.findOne({})
				expect(order?.options?.length).to.equal(1)
				expect(order?.options?.[0].quantity).to.equal(1)
			})

			it('should handle options with quantity 1 and options with undefined quantity', async function () {
				await agent.post('/v1/orders').send({
					roomId: testRoom.id,
					products: [{
						id: testProduct1.id,
						quantity: 1
					}],
					options: [{
						id: testOption1.id,
						quantity: 1
					},
					{
						id: testOption2.id
					}]
				})
				const order = await OrderModel.findOne({})
				expect(order?.options?.length).to.equal(1)
				expect(order?.options?.[0].quantity).to.equal(1)
			})
		})
	})
})

describe('GET /v1/orders', function () {
	let testProduct1: IProduct
	let testProduct2: IProduct
	let testProduct3: IProduct
	let testProduct4: IProduct

	let testRoom: IRoom
	let testOption: IOption
	
	let clock: sinon.SinonFakeTimers

	let date05: Date
	let date1: Date
	let date15: Date
	let date2: Date
	let date25: Date
	let date3: Date
	let date35: Date
	let date4: Date

	beforeEach(async function () {
		date05 = new Date('2024-04-23T13:00:00Z')
		date1 = new Date('2024-04-24T11:00:00Z') // Product 1, Product 2
		date15 = new Date('2024-04-24T13:00:00Z')
		date2 = new Date('2024-04-25T11:00:00Z') // Product 3
		date25 = new Date('2024-04-25T13:00:00Z')
		date3 = new Date('2024-04-26T11:00:00Z') // Product 4
		date35 = new Date('2024-04-26T13:00:00Z')
		date4 = new Date('2024-04-27T11:00:00Z')

		clock = sinon.useFakeTimers(date1)

		testProduct1 = await ProductModel.create({
			name: 'Test Product 1',
			price: 100,
			description: 'A test product',
			orderWindow: {
				from: {
					hour: 0,
					minute: 0
				},
				to: {
					hour: 23,
					minute: 59
				}
			}
		})

		testProduct2 = await ProductModel.create({
			name: 'Test Product 2',
			price: 100,
			description: 'A test product',
			orderWindow: {
				from: {
					hour: 0,
					minute: 0
				},
				to: {
					hour: 23,
					minute: 59
				}
			}
		})

		testProduct3 = await ProductModel.create({
			name: 'Test Product 3',
			price: 100,
			description: 'A test product',
			orderWindow: {
				from: {
					hour: 0,
					minute: 0
				},
				to: {
					hour: 23,
					minute: 59
				}
			}
		})

		testProduct4 = await ProductModel.create({
			name: 'Test Product 4',
			price: 100,
			description: 'A test product',
			orderWindow: {
				from: {
					hour: 0,
					minute: 0
				},
				to: {
					hour: 23,
					minute: 59
				}
			}
		})

		testRoom = await RoomModel.create({
			name: 'Test Room',
			description: 'A test room'
		})

		testOption = await OptionModel.create({
			name: 'Test Option',
			price: 50,
			description: 'A test option'
		})

		await OrderModel.create({
			roomId: testRoom.id,
			products: [{
				id: testProduct1.id,
				quantity: 1
			}],
			options: [{
				id: testOption.id,
				quantity: 1
			}]
		})

		await OrderModel.create({
			roomId: testRoom.id,
			products: [{
				id: testProduct2.id,
				quantity: 1
			}],
			options: [{
				id: testOption.id,
				quantity: 1
			}]
		})
	})

	it('should return all orders', async function () {
		const res = await agent.get('/v1/orders')
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(res.body).to.exist
		expect(res.body[0].roomId).to.equal(testRoom.id)
		expect(res.body[0].products[0].id).to.equal(testProduct1.id)
		expect(res.body[0].products[0].quantity).to.equal(1)
		expect(res.body[0].options[0].id).to.equal(testOption.id)
		expect(res.body[0].options[0].quantity).to.equal(1)
		expect(res.body[1].roomId).to.equal(testRoom.id)
		expect(res.body[1].products[0].id).to.equal(testProduct2.id)
		expect(res.body[1].products[0].quantity).to.equal(1)
		expect(res.body[1].options[0].id).to.equal(testOption.id)
		expect(res.body[1].options[0].quantity).to.equal(1)
		expect(res.body.length).to.equal(2)
	})

	it('should return an empty array if there are no orders', async function () {
		await OrderModel.deleteMany({})
		const res = await agent.get('/v1/orders')
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(res.body).to.exist
		expect(res.body.length).to.equal(0)
	})

	describe('GET /v1/orders/?fromDate&toDate', function () {
		beforeEach(async function () {
			clock.tick(24 * 60 * 60 * 1000) // Advance time by 24 hours
			await OrderModel.create({
				roomId: testRoom.id,
				products: [{
					id: testProduct3.id,
					quantity: 1
				}],
				options: [{
					id: testOption.id,
					quantity: 1
				}]
			})
			clock.tick(24 * 60 * 60 * 1000) // Advance time by another 24 hours
			await OrderModel.create({
				roomId: testRoom.id,
				products: [{
					id: testProduct4.id,
					quantity: 1
				}],
				options: [{
					id: testOption.id,
					quantity: 1
				}]
			})
		})

		it('should return an empty array if there are no orders in the interval', async function () {
			const res = await agent.get(`/v1/orders/?fromDate=${date35.toISOString()}&toDate=${date4.toISOString()}`)
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(res.body).to.exist
			expect(res.body.length).to.equal(0)
		})

		it('should return an order', async function () {
			const res = await agent.get(`/v1/orders/?fromDate=${date15.toISOString()}&toDate=${date25.toISOString()}`)
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(res.body).to.exist
			expect(res.body.length).to.equal(1)
			expect(res.body[0].products[0].id).to.equal(testProduct3.id)
		})

		it('should return two orders', async function () {
			const res = await agent.get(`/v1/orders/?fromDate=${date05.toISOString()}&toDate=${date15.toISOString()}`)
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(res.body).to.exist
			expect(res.body.length).to.equal(2)
			expect(res.body[0].products[0].id).to.equal(testProduct1.id)
			expect(res.body[1].products[0].id).to.equal(testProduct2.id)
		})

		it('should return orders over longer intervals', async function () {
			const res = await agent.get(`/v1/orders/?fromDate=${date05.toISOString()}&toDate=${date3.toISOString()}`)
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(res.body).to.exist
			expect(res.body.length).to.equal(4)
			expect(res.body[0].products[0].id).to.equal(testProduct1.id)
		})

		it('should return the order inclusive of the date with same from and to date', async function () {
			const res = await agent.get(`/v1/orders/?fromDate=${date2.toISOString()}&toDate=${date2.toISOString()}`)
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(res.body).to.exist
			expect(res.body.length).to.equal(1)
			expect(res.body[0].products[0].id).to.equal(testProduct3.id)
		})

		it('should return multiple orders inclusive of the date with same from and to date', async function () {
			const res = await agent.get(`/v1/orders/?fromDate=${date1.toISOString()}&toDate=${date1.toISOString()}`)
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(res.body).to.exist
			expect(res.body.length).to.equal(2)
			expect(res.body[0].products[0].id).to.equal(testProduct1.id)
		})

		it('should return orders inclusive of the to date', async function () {
			const res = await agent.get(`/v1/orders/?fromDate=${date25.toISOString()}&toDate=${date3.toISOString()}`)
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(res.body).to.exist
			expect(res.body.length).to.equal(1)
			expect(res.body[0].products[0].id).to.equal(testProduct4.id)
		})

		it('should return all orders if no dates are provided', async function () {
			const res = await agent.get('/v1/orders')
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(res.body).to.exist
			expect(res.body.length).to.equal(4)
			expect(res.body[0].products[0].id).to.equal(testProduct1.id)
		})

		it('should return all following orders if only fromDate is provided', async function () {
			const res = await agent.get(`/v1/orders/?fromDate=${date15.toISOString()}`)
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(res.body).to.exist
			expect(res.body.length).to.equal(2)
			expect(res.body[0].products[0].id).to.equal(testProduct3.id)
		})

		it('should return all previous orders if only toDate is provided', async function () {
			const res = await agent.get(`/v1/orders/?toDate=${date25.toISOString()}`)
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(res.body).to.exist
			expect(res.body.length).to.equal(3)
			expect(res.body[0].products[0].id).to.equal(testProduct1.id)
		})

		it('should not return orders if fromDate is after toDate', async function () {
			const res = await agent.get(`/v1/orders/?fromDate=${date3.toISOString()}&toDate=${date1.toISOString()}`)
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(res.body).to.exist
			expect(res.body.length).to.equal(0)
		})
	})
})
