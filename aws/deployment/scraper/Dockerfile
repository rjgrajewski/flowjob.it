# Use Microsoft Playwright image which has all browsers pre-installed
FROM mcr.microsoft.com/playwright/python:v1.52.0-noble

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY ../../requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ../../src/ ./src/

# Set environment variables
ENV PYTHONPATH=/app/src
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash scraper
RUN chown -R scraper:scraper /app
USER scraper

# Set the default command (with unbuffered output for CloudWatch Logs)
CMD ["python", "-u", "-m", "scraper"]
