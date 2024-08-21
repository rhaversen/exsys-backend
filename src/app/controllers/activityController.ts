// Node.js built-in modules

// Third-party libraries
import { type NextFunction, type Request, type Response } from 'express'
import mongoose from 'mongoose'

// Own modules
import logger from '../utils/logger.js'
import ActivityModel from '../models/Activity.js'

export async function createActivity (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Creating activity')

	// Create a new object with only the allowed fields
	const allowedFields: Record<string, unknown> = {
		name: req.body.name,
		roomId: req.body.roomId
	}

	try {
		const newActivity = await (await ActivityModel.create(allowedFields)).populate('roomId')
		res.status(201).json(newActivity)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getActivity (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting activity')

	try {
		const activity = await ActivityModel.findById(req.params.id).populate('roomId')

		if (activity === null || activity === undefined) {
			res.status(404).json({ error: 'Aktivitet ikke fundet' })
			return
		}

		res.status(200).json(activity)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function getActivities (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Getting activities')

	try {
		const activities = await ActivityModel.find({}).populate('roomId')
		res.status(200).json(activities)
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}

export async function patchActivity (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Patching activity')

	const session = await mongoose.startSession()
	session.startTransaction()

	try {
		const activity = await ActivityModel.findById(req.params.id).session(session)

		if (activity === null || activity === undefined) {
			res.status(404).json({ error: 'Aktivitet ikke fundet' })
			return
		}

		// Manually set each field from allowed fields if it's present in the request body
		if (req.body.name !== undefined) activity.name = req.body.name
		if (req.body.roomId !== undefined) activity.roomId = req.body.roomId

		// Validate and save the updated document
		await activity.validate()
		await activity.save({ session })

		await activity.populate('roomId')

		await session.commitTransaction()
		res.status(200).json(activity)
	} catch (error) {
		await session.abortTransaction()

		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	} finally {
		await session.endSession()
	}
}

export async function deleteActivity (req: Request, res: Response, next: NextFunction): Promise<void> {
	logger.silly('Deleting activity')

	if (req.body.confirm === undefined || req.body.confirm === null || typeof req.body.confirm !== 'boolean' || req.body.confirm !== true) {
		res.status(400).json({ error: 'Kræver konfirmering' })
		return
	}

	try {
		const activity = await ActivityModel.findByIdAndDelete(req.params.id)

		if (activity === null || activity === undefined) {
			res.status(404).json({ error: 'Aktivitet ikke fundet' })
			return
		}

		res.status(204).send()
	} catch (error) {
		if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
			res.status(400).json({ error: error.message })
		} else {
			next(error)
		}
	}
}
