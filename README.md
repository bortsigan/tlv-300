# tlv-300
Frontend for TLV-300


## Setup

Make sure to install the dependencies:

```bash

# clone the repository
git clone https://github.com/bortsigan/tlv-300.git

# go to your project
cd tlv-300

# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install

```

## Development Server

Start the development server on `http://localhost:5000`:

```bash
# npm
npm run dev

# pnpm
pnpm run dev

# yarn
yarn dev

# bun
bun run dev
```

## ENV

```bash
# copy .env.example
cp .env.example .env

# copy the URL provided from the termin after you run the `php artisan serve` in the backend to the API_URL variable in the .env
# example
API_URL=http://127.0.0.1:8000
```