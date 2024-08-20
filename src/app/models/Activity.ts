// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema } from 'mongoose'
import logger from '../utils/logger.js'

// Interfaces
export interface IActivity extends Document {
	// Properties
	_id: Schema.Types.ObjectId
	roomId: Schema.Types.ObjectId // Where the activity is dining
	name: string

	// Timestamps
	createdAt: Date
	updatedAt: Date
}

// Schema
const activitySchema = new Schema<IActivity>({
	roomId: {
		type: Schema.Types.ObjectId,
		ref: 'Room',
		required: true
	},
	name: {
		type: Schema.Types.String,
		required: true,
		trim: true,
		unique: true
	}
}, {
	timestamps: true
})

// Validations
activitySchema.path('name').validate(async function (v: string) {
	const foundActivityWithName = await ActivityModel.findOne({ name: v, _id: { $ne: this._id } })
	return foundActivityWithName === null || foundActivityWithName === undefined
}, 'Navnet er allerede i brug')

// Pre-save middleware
activitySchema.pre('save', async function (next) {
	logger.silly('Saving activity')
	next()
})

// Compile the schema into a model
const ActivityModel = model<IActivity>('Activity', activitySchema)

// Export the model
export default ActivityModel
