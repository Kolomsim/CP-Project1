import { Link } from 'react-router'
import { Group, Text, Menu, Avatar, Button, CopyButton, ActionIcon, Tooltip } from '@mantine/core'
import { IconGitCompare, IconHeart, IconUser, IconLogout, IconChevronDown, IconCopy, IconCheck } from '@tabler/icons-react'
import { useAuth } from '../context/AuthContext'
import classes from './AppChrome.module.css'

export function Header() {
	const { user, isAuthenticated, isLoading, logout } = useAuth()

	return (
		<header style={{ height: '100%' }}>
			<Group h='100%' px='md' justify='space-between'>
				<Text component={Link} to='/' className={classes.brand}>
					Smart<span className={classes.brandAccent}>Check</span>
				</Text>
				<Group gap='xs'>
					{isLoading ? (
						<Button className={classes.navBtn} variant='default' size='sm' loading>
							Загрузка
						</Button>
					) : isAuthenticated && user ? (
						<>
							<Button
								component={Link}
								to='/comparison'
								className={classes.navBtn}
								variant='default'
								size='sm'
								leftSection={<IconGitCompare stroke={1.5} size={18} />}
							>
								Сравнение
							</Button>
							<Button
								component={Link}
								to='/favorites'
								className={classes.navBtn}
								variant='default'
								size='sm'
								leftSection={<IconHeart stroke={1.5} size={18} />}
							>
								Избранное
							</Button>
							<Menu shadow='md' width={200}>
								<Menu.Target>
									<Button
										className={classes.navBtn}
										variant='default'
										size='sm'
										rightSection={<IconChevronDown size={14} />}
										leftSection={
											<Avatar size='sm' color='brand' radius='xl'>
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
									<Menu.Label>Ваш логин</Menu.Label>
									<Menu.Item
										closeMenuOnClick={false}
										rightSection={
											<CopyButton value={user.name} timeout={2000}>
												{({ copied, copy }) => (
													<Tooltip label={copied ? 'Скопировано' : 'Скопировать'} withArrow position='right'>
														<ActionIcon
															variant='subtle'
															color={copied ? 'brand' : 'gray'}
															size='sm'
															onClick={copy}
														>
															{copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
														</ActionIcon>
													</Tooltip>
												)}
											</CopyButton>
										}
									>
										<Text size='sm' ff='monospace' fw={500}>
											{user.name}
										</Text>
									</Menu.Item>
									<Menu.Divider />
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
							className={classes.navBtn}
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
