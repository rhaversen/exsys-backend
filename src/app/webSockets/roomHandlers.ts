// Node.js built-in modules

// Third-party libraries

// Own modules
import { emitSocketEvent } from '../utils/socket.js'
import { type IRoom } from '../models/Room.js'

// Environment variables

// Config variables

// Destructuring and global variables

export function emitRoomCreated (room: IRoom): void {
	emitSocketEvent<IRoom>(
		'roomCreated',
		room,
		`Broadcasted room created for room ${room.id}`
	)
}

export function emitRoomUpdated (room: IRoom): void {
	emitSocketEvent<IRoom>(
		'roomUpdated',
		room,
		`Broadcasted room updated for room ${room.id}`
	)
}

export function emitRoomDeleted (roomId: string): void {
	emitSocketEvent<string>(
		'roomDeleted',
		roomId,
		`Broadcasted room deleted for room ${roomId}`
	)
}
