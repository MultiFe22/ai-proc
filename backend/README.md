# AI-Powered Procurement Assistant API

An intelligent procurement assistant that leverages AI to help procurement professionals find, evaluate, and select suppliers based on specific components and geographical locations.

## Overview

This API utilizes Claude's advanced web search capabilities to conduct comprehensive supplier research, extracting structured data about suppliers including their product offerings, certifications, lead times, and other key procurement metrics. The system analyzes and processes this information to provide procurement specialists with actionable insights and supplier recommendations.

## Features

- **Intelligent Supplier Search**: Find suppliers for specific components in target countries using AI-powered web search
- **Structured Supplier Data**: Extract detailed information about suppliers including contact information, product specifications, and business metrics
- **Procurement Insights**: Get AI-generated summaries and evaluations of suppliers' strengths and weaknesses
- **Data Persistence**: Store search results and supplier information in MongoDB for future reference
- **Asynchronous Processing**: Submit long-running supplier search requests that can take several minutes without blocking the client
- **Task Status Tracking**: Monitor the progress of supplier discovery tasks in real-time

## Tech Stack

- **FastAPI**: High-performance API framework
- **MongoDB** (with Beanie ODM): NoSQL database for storing search results and supplier information
- **Claude AI API**: Anthropic's Claude large language model with web search capabilities
- **Python 3.8+**: Core programming language

## Installation

### Prerequisites

- Python 3.8 or higher
- MongoDB instance (local or remote)
- Anthropic API key for Claude

### Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd hackathon-ai/backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables by creating a `.env` file:
   ```
   ANTHROPIC_API_KEY=your_claude_api_key
   MONGODB_USER=your_mongodb_username
   MONGODB_PASSWORD=your_mongodb_password
   MONGODB_HOST=localhost
   MONGODB_PORT=27017
   MONGODB_DB_NAME=procurement_assistant
   ```

5. Initialize the database:
   ```bash
   ./init_db.sh
   ```

## Usage

### Starting the Server

Run the API server:
```bash
python -m app.main
```

Or use the setup script:
```bash
./setup.sh
```

The API will be available at `http://localhost:8000`.

### API Endpoints

#### Health Check
- `GET /`: Verify the API is running

#### Supplier Discovery
- `POST /discovery/query`: Search for suppliers based on component and country (synchronous)
  ```json
  {
    "component": "carbon steel sheets",
    "country": "Germany"
  }
  ```

- `POST /discovery/query/async`: Start an asynchronous search for suppliers (returns immediately with a task ID)
  ```json
  {
    "component": "carbon steel sheets",
    "country": "Germany"
  }
  ```

- `GET /discovery/tasks/{task_id}`: Check the status of an asynchronous supplier search task
  ```
  /discovery/tasks/6458723ab1c88e9f3a1d5e02
  ```

- `GET /discovery/tasks/{task_id}/results`: Get the results of a completed supplier search task
  ```
  /discovery/tasks/6458723ab1c88e9f3a1d5e02/results
  ```

- `GET /discovery/results`: Retrieve stored suppliers with optional filtering
  ```
  /discovery/results?component=carbon%20steel%20sheets&country=Germany
  ```

- `POST /discovery/process-search/{search_id}`: Process a specific search result into structured supplier data

## Data Models

### SearchResult

Stores raw search results from Claude's web search:

- `query_component`: Component that was searched for
- `query_country`: Country that was searched in
- `raw_ai_response`: Raw response from Claude containing text content
- `search_date`: When the search was performed
- `is_processed`: Whether search has been processed into supplier objects

### Supplier

Structured supplier information:

- `name`: Company name
- `website`: Website URL
- `location`: Headquarters location
- `product`: Product description
- `component_type`: Type of component supplied
- `country`: Country of operation
- `lead_time_days`: Typical lead time in days
- `min_order_qty`: Minimum order quantity
- `certifications`: List of certifications (ISO, etc.)
- `summary`: AI-generated evaluation summary
- `raw_ai_source`: Source data for this supplier

### SupplierTask

Tracks the status of asynchronous supplier search operations:

- `component`: Component being searched for
- `country`: Country being searched in
- `status`: Current status of the task (queued, processing, completed, failed)
- `message`: Human-readable description of current task status/progress
- `search_result_id`: Reference to the associated search result
- `supplier_count`: Number of suppliers extracted (when complete)
- `started_at`: When the task was created
- `completed_at`: When the task finished (successfully or with failure)

## Development

### Debug Tools

The project includes a Jupyter notebook for debugging Claude's web search functionality:
```bash
jupyter notebook debug_web_search.ipynb
```

## Architecture

1. **Web Search**: Claude searches for suppliers based on component and country
2. **Text Processing**: The raw search results are stored as `SearchResult` objects
3. **Supplier Extraction**: Claude processes the search results to extract structured supplier data
4. **Data Storage**: The structured supplier information is stored in MongoDB
5. **Asynchronous Processing**: Long-running supplier searches run in the background while clients can check progress

### Async Search Flow

1. Client submits a supplier search request via `/discovery/query/async`
2. Server immediately creates and returns a task object with status "queued"
3. Background process starts executing the supplier search
4. Client polls the task status using `/discovery/tasks/{task_id}`
5. When task status becomes "completed", client retrieves results via `/discovery/tasks/{task_id}/results`

## License

[Your license information here]

## Contributors

[Your name and contributors]