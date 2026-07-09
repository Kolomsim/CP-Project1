import { Link } from 'react-router'
import { Group, Text, Menu, Avatar, Button } from '@mantine/core'
import { IconGitCompare, IconHeart, IconUser, IconLogout, IconChevronDown } from '@tabler/icons-react'
import { useAuth } from '../context/AuthContext'

export function Header() {
	const { user, isAuthenticated, isLoading, logout } = useAuth()

	return (
		<header style={{ height: '100%' }}>
			<Group h='100%' px='md' justify='space-between'>
				<Text component={Link} to='/' fw={600} style={{ textDecoration: 'none', color: 'inherit' }}>
					Сервис по проверке недвижимости
				</Text>
				<Group gap='xs'>
					{isLoading ? (
						<Button variant='default' size='sm' loading>
							Загрузка
						</Button>
					) : isAuthenticated && user ? (
						<>
							<Button
								component={Link}
								to='/comparison'
								variant='default'
								size='sm'
								leftSection={<IconGitCompare stroke={1.5} size={18} />}
							>
								Сравнение
							</Button>
							<Button
								component={Link}
								to='/favorites'
								variant='default'
								size='sm'
								leftSection={<IconHeart stroke={1.5} size={18} />}
							>
								Избранное
							</Button>
							<Menu shadow='md' width={200}>
								<Menu.Target>
									<Button
										variant='default'
										size='sm'
										rightSection={<IconChevronDown size={14} />}
										leftSection={
											<Avatar size='sm' color='violet' radius='xl'>
												{user.name.charAt(0).toUpperCase()}
											</Avatar>
										}
									>
										<Text size='sm' maw={100} truncate>
											{user.name}
										</Text>
									</Button>
								</Menu.Target>
								<Menu.Dropdown>
									<Menu.Item leftSection={<IconLogout size={16} />} color='red' onClick={logout}>
										Выйти
									</Menu.Item>
								</Menu.Dropdown>
							</Menu>
						</>
					) : (
						<Button
							component={Link}
							to='/auth'
							variant='default'
							size='sm'
							leftSection={<IconUser stroke={1.5} size={18} />}
						>
							Войти
						</Button>
					)}
				</Group>
			</Group>
		</header>
	)
}
