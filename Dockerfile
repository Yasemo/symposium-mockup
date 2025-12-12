# Use the official Deno image
FROM denoland/deno:latest

# Set the working directory
WORKDIR /app

# Copy the project files
COPY . .

# Expose port 80 for Cloud Run
EXPOSE 80

# Set the PORT environment variable for Cloud Run
ENV PORT=80

# Run the application
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-env", "server.ts"]
