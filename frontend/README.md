# Frontend

React-приложение на TypeScript, собранное с помощью [Vite](https://vite.dev/). UI — [Mantine](https://mantine.dev/), маршрутизация — [React Router](https://reactrouter.com/).

## Требования

- [Node.js](https://nodejs.org/) 18 или новее
- npm (идёт вместе с Node.js)

## Установка

Перейдите в каталог `frontend` и установите зависимости:

```bash
cd frontend
npm install
```

## Запуск

### Режим разработки

Запускает dev-сервер с hot reload:

```bash
npm run dev
```

После старта приложение будет доступно по адресу [http://localhost:5173](http://localhost:5173).

### Сборка для production

```bash
npm run build
```

Собранные файлы появятся в каталоге `dist/`.

### Просмотр production-сборки локально

```bash
npm run preview
```

## Другие команды

```bash
npm run lint   # проверка кода ESLint
```
