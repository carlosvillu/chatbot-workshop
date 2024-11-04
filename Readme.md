# RAG Chatbot Workshop

This workshop guides you through building a RAG (Retrieval-Augmented Generation) chatbot from scratch, using only local resources with Ollama. You'll learn how to create a complete system that can intelligently answer questions based on your documents.

## Author
Carlos Villuendas - [@carlosvillu](https://twitter.com/carlosvillu)

## Prerequisites

- [Node.js](https://nodejs.org/) v22 or higher
- [Ollama](https://ollama.ai/) installed locally
- [Docker](https://www.docker.com/) and Docker Compose
- Basic understanding of TypeScript and JavaScript
- Basic knowledge of RAG systems and embeddings

## Installation

1. Clone the repository:
```bash
git clone https://github.com/carlosvillu/chatbot-workshop
```

2. Install dependencies:
```bash
cd chatbot-workshop
npm run phoenix
```

## Installing and Setting up Ollama

### Linux Installation
1. Install Ollama using the official install script:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

2. Verify the installation:
```bash
ollama --version
```

### Starting Ollama Server

1. Start the Ollama server:
```bash
ollama serve
```

2. Download required models:
```bash
# Download base model for chat
ollama pull llama3.1:8b

# Download smaller model for testing
ollama pull llama3.1:3b

# Download model for embeddings
ollama pull nemotron:mini
```

You can verify installed models with:
```bash
ollama list
```

## Docker Environment

### Starting Docker Services
In the `03-ingest-vectorstore` branch, you'll find a `docker-compose.yml` file. Start the required services with:

```bash
docker-compose up -d
```

This will set up:
- ChromaDB for vector storage
- Additional required services

### Cleaning Up Docker Resources
After finishing the workshop, clean up all resources with:

```bash
# Stop all containers
docker-compose down

# Remove all volumes
docker-compose down -v

# Remove all related images
docker rmi $(docker images -q 'chromadb/*')

# Verify cleanup
docker ps -a
docker volume ls
```

## Workshop Structure

The workshop is organized in branches, each focusing on a specific aspect of RAG systems. Follow them in order:

### 1. Document Ingestion (01-ingest-documents)
Learn how to load and process documents from different sources.

### 2. Document Embedding (02-ingest-embedding)
Transform documents into vector representations using Ollama's embedding model.

### 3. Vector Storage (03-ingest-vectorstore)
Store and manage document embeddings efficiently using ChromaDB.

### 4. Question Embedding (04-consumer-embedding-question)
Process user questions and convert them into vector representations.

### 5. Semantic Search (05-consumer-vectorstore-search)
Implement semantic search to find relevant documents for user questions.

### 6. Chat Integration (06-consumer-chat)
Create a chat interface that uses the RAG system to answer questions.

## Learning Path

1. Start with branch `01-ingest-documents` and follow the commits
2. Once you understand each part, move to the next branch
3. Each branch builds upon the previous one
4. The final branch `06-consumer-chat` contains the complete working chatbot

## Documentation

The slides for this workshop are available at:
[https://docs.google.com/presentation/d/1QwgaD35z1KK7CqexYm5HWy2oezk_nK9Y_RcoM6Ej8oY/edit?usp=sharing](https://docs.google.com/presentation/d/125PssUk4htf_m_K3a_EqzWZwp2cgQ-p8eUybsjFKwVg/edit?usp=sharing)

## Troubleshooting

### Ollama
- If you encounter issues with Ollama, ensure the server is running with `ollama serve`
- Check server status: `curl http://localhost:11434/api/tags`
- Verify model installation: `ollama list`

### Docker
- Check running containers: `docker ps`
- View logs: `docker-compose logs -f`
- If ChromaDB fails to start, ensure ports are not in use: `lsof -i :8000`

## License

MIT
