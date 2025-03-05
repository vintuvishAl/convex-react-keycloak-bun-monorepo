FROM oven/bun:1.0.29

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install

# Copy the rest of the application
COPY . .

# Default port
EXPOSE 3000

# Start the server
CMD ["bun", "run", "dev"]