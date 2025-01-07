// Node.js built-in modules

// Third-party libraries
import { type Document, model, Schema } from 'mongoose'

// Own modules

// Environment variables

// Config variables

// Destructuring and global variables

// Interfaces
export interface IConfigs extends Document {
	// Properties
	_id: Schema.Types.ObjectId
	kioskInactivityTimeout: number
	kioskInactivityTimeoutWarning: number
	kioskOrderConfirmationTimeout: number

	// Timestamps
	createdAt: Date
	updatedAt: Date
}

// Schema
const configsSchema = new Schema<IConfigs>({
	kioskInactivityTimeout: {
		type: Schema.Types.Number,
		default: 60000, // 60 seconds
		min: [1000, 'Inaktivitets timeout skal være mindst 1 sekund'],
	},
	kioskInactivityTimeoutWarning: {
		type: Schema.Types.Number,
		default: 10000, // 10 seconds
		min: [1000, 'Inaktivitets timeout advarsel skal være mindst 1 sekund'],
	},
	kioskOrderConfirmationTimeout: {
		type: Schema.Types.Number,
		default: 10000, // 10 seconds
		min: [1000, 'Ordrebekræftelses timeout skal være mindst 1 sekund'],
	}
}, {
	timestamps: true
})

// Validations

// Adding indexes

// Pre-save middleware

// Compile the schema into a model
const ConfigsModel = model<IConfigs>('Configs', configsSchema)

// Export the model
export default ConfigsModel