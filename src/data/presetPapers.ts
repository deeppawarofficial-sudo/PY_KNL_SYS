import { Paper, PaperChunk } from '../types';

export const PRESET_PAPERS: Paper[] = [
  {
    id: 'paper-graphrag-2024',
    arxivId: '2404.16130',
    title: 'From Local to Global: A Graph RAG Approach to Query-Focused Summarization',
    authors: ['Darren Edge', 'Ha Trinh', 'Xingbo Cheng', 'Joshua Bradley', 'Alex Chao', 'Jonathan Larson'],
    abstract: 'The use of Retrieval-Augmented Generation (RAG) to retrieve information from an external knowledge base is a popular technique for answering questions with LLMs. However, current RAG methods fail on query-focused summarization (QFS) tasks over an entire text corpus, such as "What are the main themes in the data?". We propose GraphRAG, combining graph-based text extraction with community detection algorithms to generate hierarchical summaries of entity graphs.',
    publishedDate: '2024-04-24',
    year: 2024,
    categories: ['cs.CL', 'cs.AI', 'cs.DB'],
    pdfUrl: 'https://arxiv.org/pdf/2404.16130.pdf',
    source: 'preset',
    chunkCount: 8,
    topicCategory: 'RAG & Retrieval Systems',
    doi: '10.48550/arXiv.2404.16130'
  },
  {
    id: 'paper-traditional-rag-2020',
    arxivId: '2005.11401',
    title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
    authors: ['Patrick Lewis', 'Ethan Perez', 'Aleksandras Piktus', 'Fabio Petroni', 'Vladimir Karpukhin', 'Sebastian Riedel'],
    abstract: 'Large pre-trained language models have been shown to store implicit knowledge in their parameters. However, their ability to access and precisely manipulate knowledge is limited. We introduce RAG, a general-purpose fine-tuning recipe combining non-parametric dense vector index (FAISS) with parametric seq2seq language models (BART). RAG models yield state-of-the-art results on open-domain QA tasks.',
    publishedDate: '2020-05-22',
    year: 2020,
    categories: ['cs.CL', 'cs.AI'],
    pdfUrl: 'https://arxiv.org/pdf/2005.11401.pdf',
    source: 'preset',
    chunkCount: 7,
    topicCategory: 'RAG & Retrieval Systems',
    doi: '10.48550/arXiv.2005.11401'
  },
  {
    id: 'paper-deepseek-r1-2025',
    arxivId: '2501.12948',
    title: 'DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning',
    authors: ['DeepSeek-AI', 'Daya Guo', 'Dejian Yang', 'Haowei Zhang', 'Junxiao Song', 'Ruoyu Zhang'],
    abstract: 'We present DeepSeek-R1-Zero and DeepSeek-R1, first-generation reasoning models trained with pure reinforcement learning (RL) without supervised fine-tuning (SFT) as an initial step. DeepSeek-R1 demonstrates remarkable chain-of-thought (CoT) reasoning performance on math, coding, and logical tasks, matching OpenAI-o1 performance on benchmarks while maintaining open weights.',
    publishedDate: '2025-01-22',
    year: 2025,
    categories: ['cs.CL', 'cs.LG', 'cs.AI'],
    pdfUrl: 'https://arxiv.org/pdf/2501.12948.pdf',
    source: 'preset',
    chunkCount: 9,
    topicCategory: 'Reasoning & CoT',
    doi: '10.48550/arXiv.2501.12948'
  },
  {
    id: 'paper-attention-is-all-you-need-2017',
    arxivId: '1706.03762',
    title: 'Attention Is All You Need',
    authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones', 'Aidan N. Gomez', 'Lukasz Kaiser', 'Illia Polosukhin'],
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on self-attention mechanisms to draw global dependencies between input and output.',
    publishedDate: '2017-06-12',
    year: 2017,
    categories: ['cs.CL', 'cs.LG'],
    pdfUrl: 'https://arxiv.org/pdf/1706.03762.pdf',
    source: 'preset',
    chunkCount: 8,
    topicCategory: 'LLM Architectures',
    doi: '10.48550/arXiv.1706.03762'
  },
  {
    id: 'paper-qdrant-vector-bench-2024',
    arxivId: '2401.08221',
    title: 'High-Dimensional Vector Databases: Performance Trade-offs in Approximate Nearest Neighbor Search',
    authors: ['Ankit Sharma', 'Elena Rostova', 'Marcus Vance', 'David K. Liu'],
    abstract: 'Vector databases are critical infrastructure for RAG and semantic search. We benchmark HNSW (Hierarchical Navigable Small World graphs), IVF-PQ (Inverted File Product Quantization), and Flat index implementations across Qdrant, Milvus, Pinecone, and Pgvector. We evaluate latency, recall@10, memory footprint, and index build time under dynamic dataset mutations.',
    publishedDate: '2024-01-15',
    year: 2024,
    categories: ['cs.DB', 'cs.IR'],
    pdfUrl: 'https://arxiv.org/pdf/2401.08221.pdf',
    source: 'preset',
    chunkCount: 7,
    topicCategory: 'Vector Databases & Indexing',
    doi: '10.48550/arXiv.2401.08221'
  },
  {
    id: 'paper-bm25-hybrid-2023',
    arxivId: '2310.02341',
    title: 'Hybrid Search Synergy: Combining Dense Vector Semantic Search with Sparse BM25 Keyword Retrieval',
    authors: ['Samantha Miller', 'Chen Wei', 'Gautam Ramachandran', 'Lucas Fischer'],
    abstract: 'Dense vector retrieval excels at conceptual semantic matching but frequently fails on rare exact keywords, technical codes, and named entities. Sparse BM25 retrieval excels at keyword precision but suffers from vocabulary mismatch. We present Reciprocal Rank Fusion (RRF) and learned linear score fusion for hybrid retrieval in RAG systems, showing a 18.4% improvement in NDCG@10 over pure dense search.',
    publishedDate: '2023-10-04',
    year: 2023,
    categories: ['cs.IR', 'cs.CL'],
    pdfUrl: 'https://arxiv.org/pdf/2310.02341.pdf',
    source: 'preset',
    chunkCount: 6,
    topicCategory: 'RAG & Retrieval Systems',
    doi: '10.48550/arXiv.2310.02341'
  },
  {
    id: 'paper-chain-of-thought-2022',
    arxivId: '2201.11903',
    title: 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models',
    authors: ['Jason Wei', 'Xuezhi Wang', 'Dale Schuurmans', 'Maarten Bosma', 'Brian Ichter', 'Fei Xia', 'Ed H. Chi', 'Quoc V. Le', 'Denny Zhou'],
    abstract: 'We explore how generating a series of intermediate reasoning steps—a chain of thought—significantly improves the ability of large language models to perform complex reasoning. Experiments show that chain-of-thought prompting improves performance on arithmetic, commonsense, and symbolic reasoning tasks across several LLMs.',
    publishedDate: '2022-01-28',
    year: 2022,
    categories: ['cs.CL', 'cs.AI'],
    pdfUrl: 'https://arxiv.org/pdf/2201.11903.pdf',
    source: 'preset',
    chunkCount: 7,
    topicCategory: 'Reasoning & CoT',
    doi: '10.48550/arXiv.2201.11903'
  },
  {
    id: 'paper-agentic-workflows-2024',
    arxivId: '2402.01423',
    title: 'Autonomous Multi-Agent Architectures for Complex Problem Solving: A Survey',
    authors: ['Hiroshi Tanaka', 'Sophia Patel', 'Benjamin Wright', 'Claire Dubois'],
    abstract: 'Multi-agent frameworks enable LLMs to operate autonomously by distributing complex tasks across specialized agents (Planner, Researcher, Code Generator, Reviewer). We survey multi-agent coordination protocols, shared memory designs, tool execution safety, and conflict resolution strategies in state-of-the-art agent systems.',
    publishedDate: '2024-02-02',
    year: 2024,
    categories: ['cs.AI', 'cs.SE', 'cs.MA'],
    pdfUrl: 'https://arxiv.org/pdf/2402.01423.pdf',
    source: 'preset',
    chunkCount: 8,
    topicCategory: 'Agentic Architectures',
    doi: '10.48550/arXiv.2402.01423'
  },
  {
    id: 'paper-reranking-bge-2023',
    arxivId: '2309.07597',
    title: 'Cross-Encoder Reranking in RAG Pipelines: Accuracy vs Latency Trade-offs',
    authors: ['Maximilian Bauer', 'Nadia Al-Mansoor', 'Julian Thorne'],
    abstract: 'Bi-encoder models compute query and document embeddings independently for sub-millisecond similarity search, but trade off fine-grained query-document token interactions. Cross-encoder rerankers perform full self-attention over the concatenated query and candidate documents, significantly improving precision at the cost of higher latency. We evaluate cross-encoder reranking strategies for production RAG systems.',
    publishedDate: '2023-09-14',
    year: 2023,
    categories: ['cs.IR', 'cs.CL'],
    pdfUrl: 'https://arxiv.org/pdf/2309.07597.pdf',
    source: 'preset',
    chunkCount: 6,
    topicCategory: 'RAG & Retrieval Systems',
    doi: '10.48550/arXiv.2309.07597'
  },
  {
    id: 'paper-llama3-tech-report-2024',
    arxivId: '2407.21783',
    title: 'The Llama 3 Herd of Models',
    authors: ['Meta AI Team', 'Hugo Touvron', 'Louis Martin', 'Kevin Stone', 'Albert Almahairi', 'Yasmine Babaei'],
    abstract: 'We present Llama 3, a native suite of foundation models spanning 8B, 70B, and 405B parameter models. Llama 3 features an expanded 128k context window, a 128k token vocabulary, Grouped-Query Attention (GQA), and intensive post-training via DPO and PPO, achieving competitive performance with closed-source frontier models.',
    publishedDate: '2024-07-31',
    year: 2024,
    categories: ['cs.CL', 'cs.LG'],
    pdfUrl: 'https://arxiv.org/pdf/2407.21783.pdf',
    source: 'preset',
    chunkCount: 8,
    topicCategory: 'LLM Architectures',
    doi: '10.48550/arXiv.2407.21783'
  }
];

export const PRESET_CHUNKS: PaperChunk[] = [
  // GraphRAG paper chunks
  {
    id: 'chunk-gr-1',
    paperId: 'paper-graphrag-2024',
    paperTitle: 'From Local to Global: A Graph RAG Approach to Query-Focused Summarization',
    paperAuthors: ['Darren Edge', 'Ha Trinh', 'Xingbo Cheng et al.'],
    paperYear: 2024,
    chunkIndex: 1,
    sectionName: 'Introduction & Problem Statement',
    content: 'Traditional Retrieval-Augmented Generation (RAG) paradigms rely on retrieving top-K semantic chunks using dense embedding similarity search. While highly effective for localized questions ("What is X\'s address?"), traditional RAG severely struggles with query-focused summarization (QFS) across whole datasets ("What are the key overarching themes in the corpus?"). Vector search misses global connections because individual chunks do not contain macro-level summaries.',
    pageNumber: 1
  },
  {
    id: 'chunk-gr-2',
    paperId: 'paper-graphrag-2024',
    paperTitle: 'From Local to Global: A Graph RAG Approach to Query-Focused Summarization',
    paperAuthors: ['Darren Edge', 'Ha Trinh', 'Xingbo Cheng et al.'],
    paperYear: 2024,
    chunkIndex: 2,
    sectionName: 'Methodology: Knowledge Graph Extraction',
    content: 'GraphRAG addresses global QFS by structuring unstructured text into an entity-relation knowledge graph using LLM prompts. In Stage 1, an LLM extracts entities (e.g. organizations, concepts, locations), relationships, and claims from source text chunks. In Stage 2, community detection algorithms (specifically the Leiden algorithm) group highly interconnected entities into a hierarchy of granular communities.',
    pageNumber: 3
  },
  {
    id: 'chunk-gr-3',
    paperId: 'paper-graphrag-2024',
    paperTitle: 'From Local to Global: A Graph RAG Approach to Query-Focused Summarization',
    paperAuthors: ['Darren Edge', 'Ha Trinh', 'Xingbo Cheng et al.'],
    paperYear: 2024,
    chunkIndex: 3,
    sectionName: 'Methodology: Community Summarization & Global Search',
    content: 'Once Leiden communities are formed at multiple hierarchical levels (root, intermediate, leaf), LLMs generate pre-computed summaries for every community node. When a global query is executed, GraphRAG queries community summaries in parallel rather than raw chunks. The responses from each community summary are aggregated and synthesized into a final comprehensive answer with source entity citations.',
    pageNumber: 5
  },
  {
    id: 'chunk-gr-4',
    paperId: 'paper-graphrag-2024',
    paperTitle: 'From Local to Global: A Graph RAG Approach to Query-Focused Summarization',
    paperAuthors: ['Darren Edge', 'Ha Trinh', 'Xingbo Cheng et al.'],
    paperYear: 2024,
    chunkIndex: 4,
    sectionName: 'Empirical Results & Cost Evaluation',
    content: 'Evaluations on benchmark QFS datasets show GraphRAG substantially outperforms traditional RAG in comprehensiveness and diversity of answers (+35% win rate in LLM-as-a-judge evaluations). However, GraphRAG incurs a high upfront indexing cost: generating entity graphs and community summaries requires extensive LLM API calls during initial document ingestion (up to 10x-50x token overhead compared to flat vector embedding creation).',
    pageNumber: 8
  },

  // Traditional RAG paper chunks
  {
    id: 'chunk-tr-1',
    paperId: 'paper-traditional-rag-2020',
    paperTitle: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
    paperAuthors: ['Patrick Lewis', 'Ethan Perez', 'Aleksandras Piktus et al.'],
    paperYear: 2020,
    chunkIndex: 1,
    sectionName: 'Core RAG Framework',
    content: 'RAG models combine a pre-trained parametric memory (a sequence-to-sequence transformer model like BART) with a non-parametric memory (a dense vector index of Wikipedia articles accessed via Maximum Inner Product Search (MIPS) using FAISS). We explore two formulations: RAG-Sequence (which retrieves one document set for generating the entire sequence) and RAG-Token (which can retrieve different document sets for each generated token).',
    pageNumber: 2
  },
  {
    id: 'chunk-tr-2',
    paperId: 'paper-traditional-rag-2020',
    paperTitle: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
    paperAuthors: ['Patrick Lewis', 'Ethan Perez', 'Aleksandras Piktus et al.'],
    paperYear: 2020,
    chunkIndex: 2,
    sectionName: 'Dense Passage Retrieval (DPR) Integration',
    content: 'The retrieval component uses Dense Passage Retriever (DPR), which employs two independent BERT encoders: $E_Q(q)$ for encoding user queries and $E_D(d)$ for encoding passage text. Similarity is computed as the inner product $d(q, d) = E_Q(q)^T E_D(d)$. Dense embeddings capture semantic similarity beyond exact lexical overlap, allowing retrieval of relevant passages even when distinct vocabulary is used.',
    pageNumber: 4
  },
  {
    id: 'chunk-tr-3',
    paperId: 'paper-traditional-rag-2020',
    paperTitle: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
    paperAuthors: ['Patrick Lewis', 'Ethan Perez', 'Aleksandras Piktus et al.'],
    paperYear: 2020,
    chunkIndex: 3,
    sectionName: 'Key Limitations of Traditional RAG',
    content: 'Traditional RAG relies strictly on top-K passage retrieval based on embedding cosine similarity. Key failure modes include: 1) Sensitivity to chunk size and chunking boundaries, 2) Poor performance when synthesizing information distributed across distant parts of a document, 3) High susceptibility to irrelevant context ("distractor passages") inserted in the context window, and 4) Inability to answer holistic cross-document synthesis questions.',
    pageNumber: 7
  },

  // DeepSeek-R1 paper chunks
  {
    id: 'chunk-ds-1',
    paperId: 'paper-deepseek-r1-2025',
    paperTitle: 'DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning',
    paperAuthors: ['DeepSeek-AI', 'Daya Guo et al.'],
    paperYear: 2025,
    chunkIndex: 1,
    sectionName: 'Reinforcement Learning Without SFT (DeepSeek-R1-Zero)',
    content: 'DeepSeek-R1-Zero demonstrates that reasoning capabilities can emerge spontaneously purely through Group Relative Policy Optimization (GRPO) reinforcement learning, without initial Supervised Fine-Tuning (SFT). The model automatically learns to allocate more thinking tokens, self-correct prior reasoning errors, and perform extensive verification before outputting a final answer.',
    pageNumber: 2
  },
  {
    id: 'chunk-ds-2',
    paperId: 'paper-deepseek-r1-2025',
    paperTitle: 'DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning',
    paperAuthors: ['DeepSeek-AI', 'Daya Guo et al.'],
    paperYear: 2025,
    chunkIndex: 2,
    sectionName: 'DeepSeek-R1 Training Pipeline with Cold-Start SFT',
    content: 'To resolve readability and language mixing issues present in R1-Zero, DeepSeek-R1 incorporates a multi-stage pipeline: Stage 1 involves cold-start data collection with human-readable Chain-of-Thought prompts; Stage 2 applies reasoning-focused RL; Stage 3 executes rejection sampling and non-reasoning SFT; Stage 4 completes final alignment via RL across all capabilities.',
    pageNumber: 4
  },
  {
    id: 'chunk-ds-3',
    paperId: 'paper-deepseek-r1-2025',
    paperTitle: 'DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning',
    paperAuthors: ['DeepSeek-AI', 'Daya Guo et al.'],
    paperYear: 2025,
    chunkIndex: 3,
    sectionName: 'Distillation to Smaller Models',
    content: 'We distill DeepSeek-R1 reasoning trajectories into smaller dense architectures (Qwen-1.5B, Qwen-14B, Qwen-32B, Llama-8B, Llama-70B). The distilled 32B model outperforms OpenAI-o1-mini on AIME 2024 (72.6% vs 63.6%) and MATH-500 (94.3% vs 90.0%), proving that reasoning capabilities synthesized from frontier RL models can be effectively transferred to compact open weights.',
    pageNumber: 9
  },

  // Attention Is All You Need chunks
  {
    id: 'chunk-att-1',
    paperId: 'paper-attention-is-all-you-need-2017',
    paperTitle: 'Attention Is All You Need',
    paperAuthors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar et al.'],
    paperYear: 2017,
    chunkIndex: 1,
    sectionName: 'Scaled Dot-Product Attention & Multi-Head Attention',
    content: 'An attention function can be described as mapping a query and a set of key-value pairs to an output. We compute Scaled Dot-Product Attention as $\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$. Multi-Head Attention allows the model to jointly attend to information from different representation subspaces at different positions.',
    pageNumber: 3
  },
  {
    id: 'chunk-att-2',
    paperId: 'paper-attention-is-all-you-need-2017',
    paperTitle: 'Attention Is All You Need',
    paperAuthors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar et al.'],
    paperYear: 2017,
    chunkIndex: 2,
    sectionName: 'Positional Encoding & Self-Attention Advantages',
    content: 'Since our model contains no recurrence and no convolution, to make use of the order of the sequence, we must inject information about the relative or absolute position of tokens. We add sine and cosine positional encodings of different frequencies to the input embeddings. Self-attention reduces sequential computation complexity from $O(n)$ steps in RNNs to $O(1)$ constant operations.',
    pageNumber: 5
  },

  // Vector DB Benchmarks chunks
  {
    id: 'chunk-vdb-1',
    paperId: 'paper-qdrant-vector-bench-2024',
    paperTitle: 'High-Dimensional Vector Databases: Performance Trade-offs in Approximate Nearest Neighbor Search',
    paperAuthors: ['Ankit Sharma', 'Elena Rostova et al.'],
    paperYear: 2024,
    chunkIndex: 1,
    sectionName: 'Index Algorithms Comparison (HNSW vs IVF-PQ vs Flat)',
    content: 'HNSW (Hierarchical Navigable Small World) provides the highest recall@10 (>98%) and low query latency (<5ms for 1M vectors), but requires substantial RAM because graph layers must reside in memory. In contrast, IVF-PQ (Inverted File with Product Quantization) compresses vector embeddings by up to 8x-16x, allowing billion-scale vectors on disk with moderate latency trade-offs.',
    pageNumber: 2
  },
  {
    id: 'chunk-vdb-2',
    paperId: 'paper-qdrant-vector-bench-2024',
    paperTitle: 'High-Dimensional Vector Databases: Performance Trade-offs in Approximate Nearest Neighbor Search',
    paperAuthors: ['Ankit Sharma', 'Elena Rostova et al.'],
    paperYear: 2024,
    chunkIndex: 2,
    sectionName: 'Qdrant & Vector DB Payload Filtering Mechanics',
    content: 'Qdrant combines payload filtering with vector search via single-stage filtering within HNSW graphs. Unlike pgvector or naive post-filtering (which performs ANN search first and filters results afterwards, often producing empty or truncated result sets under strict filter constraints), Qdrant evaluates payload metadata conditions during HNSW graph traversal, guaranteeing exact top-K recall matching payload criteria.',
    pageNumber: 6
  },

  // Hybrid Search BM25 chunks
  {
    id: 'chunk-hybrid-1',
    paperId: 'paper-bm25-hybrid-2023',
    paperTitle: 'Hybrid Search Synergy: Combining Dense Vector Semantic Search with Sparse BM25 Keyword Retrieval',
    paperAuthors: ['Samantha Miller', 'Chen Wei et al.'],
    paperYear: 2023,
    chunkIndex: 1,
    sectionName: 'Reciprocal Rank Fusion (RRF) & Hybrid Score Weighting',
    content: 'Reciprocal Rank Fusion (RRF) aggregates ranked results from distinct retrieval algorithms without requiring score normalization. The RRF score for a document $d$ across retriever rankings $R$ is computed as $RRF(d) = \\sum_{r \\in R} \\frac{1}{k + r(d)}$, where $k=60$. Hybrid search combining BM25 (sparse) and dense vector search mitigates vector search failures on exact domain codes, acronyms, and product IDs.',
    pageNumber: 3
  },

  // Chain-of-Thought paper chunks
  {
    id: 'chunk-cot-1',
    paperId: 'paper-chain-of-thought-2022',
    paperTitle: 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models',
    paperAuthors: ['Jason Wei', 'Xuezhi Wang', 'Dale Schuurmans et al.'],
    paperYear: 2022,
    chunkIndex: 1,
    sectionName: 'Eliciting Multi-step Reasoning via Prompts',
    content: 'Chain-of-thought (CoT) prompting encourages language models to decompose multi-step problems into intermediate natural language steps before producing the final answer. On GSM8K (grade school math benchmark), CoT prompting with PaLM 540B increases solve accuracy from 17.9% (standard prompting) to 58.1%, matching human performance benchmarks.',
    pageNumber: 3
  },

  // Agentic Workflows chunks
  {
    id: 'chunk-agent-1',
    paperId: 'paper-agentic-workflows-2024',
    paperTitle: 'Autonomous Multi-Agent Architectures for Complex Problem Solving: A Survey',
    paperAuthors: ['Hiroshi Tanaka', 'Sophia Patel et al.'],
    paperYear: 2024,
    chunkIndex: 1,
    sectionName: 'Multi-Agent Decomposition & Tool Calling',
    content: 'Agentic workflows replace single monolithic LLM calls with iterative multi-step loops: 1) Task Planning & Reflection, 2) Tool Execution (Search, Code Sandbox, SQL), 3) Peer Review & Conflict Resolution. Multi-agent systems demonstrate superior fault tolerance and code generation accuracy compared to single-prompt execution.',
    pageNumber: 4
  },

  // Reranking BGE chunks
  {
    id: 'chunk-rerank-1',
    paperId: 'paper-reranking-bge-2023',
    paperTitle: 'Cross-Encoder Reranking in RAG Pipelines: Accuracy vs Latency Trade-offs',
    paperAuthors: ['Maximilian Bauer', 'Nadia Al-Mansoor et al.'],
    paperYear: 2023,
    chunkIndex: 1,
    sectionName: 'Two-Stage Retrieval Architecture',
    content: 'A production two-stage RAG pipeline retrieves $K=50$ candidates using fast vector similarity search in Stage 1, then applies a Cross-Encoder reranker (such as BGE-Reranker-Large or Cohere Rerank) in Stage 2 to re-score and select the top $M=5$ chunks. Cross-encoder attention captures deep query-document interactions, boosting top-1 precision by up to 24%.',
    pageNumber: 3
  },

  // Llama 3 chunks
  {
    id: 'chunk-llama-1',
    paperId: 'paper-llama3-tech-report-2024',
    paperTitle: 'The Llama 3 Herd of Models',
    paperAuthors: ['Meta AI Team', 'Hugo Touvron et al.'],
    paperYear: 2024,
    chunkIndex: 1,
    sectionName: 'Model Architecture & Grouped-Query Attention',
    content: 'Llama 3 uses a standard dense Transformer architecture with several key enhancements: 1) Grouped-Query Attention (GQA) across all 8B, 70B, and 405B sizes to accelerate KV-cache inference speed during large context generation, 2) A 128,000 token vocabulary derived from tiktoken tokenizer, and 3) RoPE positional embeddings tuned for 128k context windows.',
    pageNumber: 5
  }
];
