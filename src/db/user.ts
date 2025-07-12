interface IUser {
	email: string
	name: string
	id: string
	pixKey: string
}

export const users: IUser[] = [
	{
		email: 'test1@test.com',
		name: 'Alice',
		id: 'user-001',
		pixKey: 'alice-pix-key-001',
	},
	{
		email: 'test2@test.com',
		name: 'Bob',
		id: 'user-002',
		pixKey: 'bob-pix-key-002',
	},
	{
		email: 'test3@test.com',
		name: 'Charlie',
		id: 'user-003',
		pixKey: 'charlie-pix-key-003',
	},
	{
		email: 'test4@test.com',
		name: 'Diana',
		id: 'user-004',
		pixKey: 'diana-pix-key-004',
	},
	{
		email: 'test5@test.com',
		name: 'Eve',
		id: 'user-005',
		pixKey: 'eve-pix-key-005',
	},
]
