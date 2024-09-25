import { model, Schema } from 'mongoose'

export interface ISession {
	_id: string
	session: string
	expires: Date | null
}

const SessionSchema = new Schema(
	{
		_id: {
			type: String,
			required: true
		},
		session: {
			type: String,
			required: true
		},
		expires: {
			type: Date,
			required: true
		}
	},
	{ strict: false } // Allow other fields
)

// Compile the schema into a model
const Session = model<ISession>('Session', SessionSchema)

// Export the model
export default Session