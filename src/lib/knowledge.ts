/** Built-in AI/ML/CS knowledge base used by the knowledge.define intent. */

export interface Concept {
  term: string
  aliases: string[]
  def: string
  related: string[]
}

export const KB: Concept[] = [
  { term: 'Machine Learning', aliases: ['ml', 'machine learning'], def: 'A field of AI where systems learn patterns from data instead of being explicitly programmed. Core paradigms: supervised, unsupervised and reinforcement learning. A model is trained by minimising a loss function over examples, then evaluated on unseen data to measure generalisation.', related: ['Supervised Learning', 'Deep Learning', 'Overfitting'] },
  { term: 'Deep Learning', aliases: ['deep learning', 'dl'], def: 'A subfield of ML using multi-layer neural networks that learn hierarchical feature representations automatically. Powers modern vision, speech and language systems. Training relies on backpropagation and gradient descent over large datasets, typically on GPUs.', related: ['Neural Network', 'Backpropagation', 'Transformer'] },
  { term: 'Neural Network', aliases: ['neural network', 'neural networks', 'ann', 'artificial neural network'], def: 'A model composed of layers of interconnected units (neurons). Each neuron computes a weighted sum of inputs, adds a bias, and applies a non-linear activation (ReLU, sigmoid, GELU). Stacking layers lets the network approximate highly complex functions.', related: ['Deep Learning', 'Backpropagation', 'Activation Function'] },
  { term: 'Transformer', aliases: ['transformer', 'transformers', 'transformer architecture'], def: 'The architecture behind modern LLMs, introduced in “Attention Is All You Need” (2017). It replaces recurrence with self-attention, processing whole sequences in parallel. A block = multi-head attention + feed-forward layers + residual connections + layer norm. Encoders (BERT) excel at understanding; decoders (GPT) at generation.', related: ['Attention', 'LLM', 'Embedding'] },
  { term: 'Attention', aliases: ['attention', 'self-attention', 'self attention', 'multi-head attention'], def: 'A mechanism where each token computes relevance weights (via query·key dot products, softmax-normalised) over all tokens, then aggregates their values. It captures long-range dependencies and is fully parallelisable — the core innovation of transformers.', related: ['Transformer', 'Embedding'] },
  { term: 'Gradient Descent', aliases: ['gradient descent', 'sgd', 'stochastic gradient descent'], def: 'The workhorse optimiser of ML: compute the gradient of the loss w.r.t. parameters, then step parameters in the negative gradient direction scaled by a learning rate. Variants: SGD with momentum, RMSProp, Adam. Too high a learning rate diverges; too low is slow.', related: ['Backpropagation', 'Loss Function', 'Learning Rate'] },
  { term: 'Backpropagation', aliases: ['backpropagation', 'backprop'], def: 'The algorithm that computes gradients in neural networks by applying the chain rule backwards from the loss through each layer. It makes training deep networks tractable by reusing intermediate results (dynamic programming on the computation graph).', related: ['Gradient Descent', 'Neural Network'] },
  { term: 'Overfitting', aliases: ['overfitting', 'overfit'], def: 'When a model learns noise/specifics of the training set and performs poorly on new data — high training accuracy, low validation accuracy. Remedies: more data, regularisation (L1/L2), dropout, early stopping, simpler models, data augmentation.', related: ['Underfitting', 'Regularization', 'Cross-Validation'] },
  { term: 'Underfitting', aliases: ['underfitting', 'underfit'], def: 'When a model is too simple (or under-trained) to capture the underlying pattern — poor performance on both training and test data. Fix by increasing model capacity, training longer, or engineering better features.', related: ['Overfitting', 'Bias-Variance Tradeoff'] },
  { term: 'Regularization', aliases: ['regularization', 'regularisation', 'l1', 'l2', 'dropout'], def: 'Techniques that constrain a model to improve generalisation: L2 (weight decay) shrinks weights smoothly, L1 induces sparsity, dropout randomly disables neurons during training so the network cannot rely on any single pathway.', related: ['Overfitting'] },
  { term: 'Supervised Learning', aliases: ['supervised learning', 'supervised'], def: 'Learning from labelled pairs (input → target). Classification predicts discrete classes; regression predicts continuous values. Examples: spam detection, house-price prediction. Quality of labels usually matters more than model choice.', related: ['Unsupervised Learning', 'Classification'] },
  { term: 'Unsupervised Learning', aliases: ['unsupervised learning', 'unsupervised'], def: 'Learning structure from unlabelled data: clustering (K-Means, DBSCAN), dimensionality reduction (PCA, t-SNE, UMAP) and density estimation. Used for segmentation, anomaly detection and exploratory analysis.', related: ['Clustering', 'K-Means'] },
  { term: 'Reinforcement Learning', aliases: ['reinforcement learning', 'rl'], def: 'An agent learns a policy by interacting with an environment and receiving rewards. Formalised as a Markov Decision Process. Famous results: AlphaGo, game-playing agents, and RLHF — the technique used to align LLMs with human preferences.', related: ['RLHF', 'Machine Learning'] },
  { term: 'RLHF', aliases: ['rlhf', 'reinforcement learning from human feedback'], def: 'Reinforcement Learning from Human Feedback: humans rank model outputs, a reward model is trained on those rankings, then the LLM is optimised (e.g. PPO) against the reward model. It is how raw next-token predictors become helpful, safe assistants.', related: ['Reinforcement Learning', 'LLM', 'Fine-tuning'] },
  { term: 'CNN', aliases: ['cnn', 'convolutional neural network', 'convnet'], def: 'Convolutional Neural Network: uses learned filters that slide across images to detect local patterns (edges → textures → objects). Weight sharing and pooling give translation tolerance and parameter efficiency. The backbone of computer vision before ViTs.', related: ['Deep Learning', 'Neural Network'] },
  { term: 'RNN', aliases: ['rnn', 'recurrent neural network', 'lstm', 'gru'], def: 'Recurrent networks process sequences step-by-step, carrying a hidden state. LSTM/GRU gates mitigate vanishing gradients. Largely superseded by transformers for language, but still used in lightweight streaming and time-series settings.', related: ['Transformer', 'Neural Network'] },
  { term: 'Embedding', aliases: ['embedding', 'embeddings', 'word embedding', 'vector embedding'], def: 'A dense vector representation of discrete data (words, sentences, images) where geometric distance encodes semantic similarity. Foundation of semantic search, recommendation and RAG — “king − man + woman ≈ queen”.', related: ['Vector Database', 'Cosine Similarity', 'RAG'] },
  { term: 'Tokenization', aliases: ['tokenization', 'tokenisation', 'token', 'tokens', 'bpe'], def: 'Splitting text into units (tokens) a model can process. Modern LLMs use subword schemes like Byte-Pair Encoding: frequent words stay whole, rare words split into pieces. Context windows and API pricing are measured in tokens.', related: ['LLM', 'Embedding'] },
  { term: 'TF-IDF', aliases: ['tf-idf', 'tfidf', 'tf idf'], def: 'Term Frequency × Inverse Document Frequency: scores a word highly if it is frequent in a document but rare across the corpus. A classic, fast, interpretable text-relevance signal — NEKO uses it for document Q&A retrieval.', related: ['NLP', 'Embedding'] },
  { term: 'NLP', aliases: ['nlp', 'natural language processing'], def: 'Natural Language Processing: enabling machines to understand and generate human language. Tasks include classification, NER, summarisation, translation, question answering. Modern NLP is dominated by pretrained transformer models.', related: ['Transformer', 'LLM', 'TF-IDF'] },
  { term: 'LLM', aliases: ['llm', 'large language model', 'large language models', 'gpt', 'chatgpt'], def: 'Large Language Model: a transformer with billions of parameters pretrained on vast text corpora to predict the next token, then aligned via instruction tuning and RLHF. Emergent abilities include reasoning, coding and tool use. Weakness: hallucination — mitigated by RAG and grounding.', related: ['Transformer', 'RAG', 'Prompt Engineering'] },
  { term: 'Fine-tuning', aliases: ['fine-tuning', 'fine tuning', 'finetuning', 'lora'], def: 'Adapting a pretrained model to a specific task/domain by continuing training on a smaller dataset. Parameter-efficient variants (LoRA, adapters) update <1% of weights, making customisation cheap. Contrast with prompting and RAG, which change no weights.', related: ['LLM', 'Transfer Learning'] },
  { term: 'RAG', aliases: ['rag', 'retrieval augmented generation', 'retrieval-augmented generation'], def: 'Retrieval-Augmented Generation: retrieve relevant chunks from a knowledge store (usually via embeddings in a vector DB), inject them into the prompt, and let the LLM answer grounded in that context. Reduces hallucination and keeps knowledge fresh without retraining.', related: ['Embedding', 'Vector Database', 'LLM'] },
  { term: 'Prompt Engineering', aliases: ['prompt engineering', 'prompting', 'prompt'], def: 'Designing model inputs to elicit better outputs: role instructions, few-shot examples, chain-of-thought (“think step by step”), structured output formats and delimiters. Cheapest lever for improving LLM behaviour before fine-tuning.', related: ['LLM', 'RAG'] },
  { term: 'Vector Database', aliases: ['vector database', 'vector db', 'pinecone', 'faiss'], def: 'A database optimised for similarity search over embedding vectors, using indexes like HNSW for approximate nearest-neighbour lookup at scale. Examples: FAISS, pgvector, Pinecone, Milvus. The retrieval layer of RAG systems.', related: ['Embedding', 'RAG', 'Cosine Similarity'] },
  { term: 'Cosine Similarity', aliases: ['cosine similarity', 'cosine'], def: 'Similarity between two vectors measured by the cosine of the angle between them: dot(a,b)/(|a||b|), ranging −1…1. Invariant to magnitude, so it compares direction/meaning — the standard metric for comparing embeddings.', related: ['Embedding', 'Vector Database'] },
  { term: 'Clustering', aliases: ['clustering', 'cluster analysis'], def: 'Grouping data points so members of a group are more similar to each other than to other groups — without labels. Algorithms: K-Means (centroid), DBSCAN (density), hierarchical. Used for customer segmentation and anomaly detection.', related: ['K-Means', 'Unsupervised Learning'] },
  { term: 'K-Means', aliases: ['k-means', 'kmeans', 'k means'], def: 'Clustering algorithm: pick K centroids, assign each point to its nearest centroid, recompute centroids as cluster means, repeat until stable. Fast and simple; requires choosing K (elbow method) and assumes roughly spherical clusters.', related: ['Clustering', 'Unsupervised Learning'] },
  { term: 'Decision Tree', aliases: ['decision tree', 'decision trees'], def: 'A model that splits data by feature thresholds chosen to maximise purity (Gini/entropy), forming an interpretable flowchart. Prone to overfitting alone — hence ensembles like Random Forest and Gradient Boosting (XGBoost).', related: ['Random Forest', 'Supervised Learning'] },
  { term: 'Random Forest', aliases: ['random forest', 'random forests'], def: 'An ensemble of decision trees, each trained on a bootstrap sample with random feature subsets; predictions are averaged/voted. Reduces variance dramatically, handles messy tabular data well, and provides feature-importance estimates.', related: ['Decision Tree', 'Ensemble'] },
  { term: 'Linear Regression', aliases: ['linear regression'], def: 'Fits a linear relationship y = wx + b by minimising squared error. Closed-form (normal equation) or gradient descent. The baseline for regression tasks and the foundation for understanding more complex models.', related: ['Logistic Regression', 'Supervised Learning'] },
  { term: 'Logistic Regression', aliases: ['logistic regression'], def: 'A linear classifier that passes wx + b through a sigmoid to output class probabilities, trained with cross-entropy loss. Despite the name it is classification, not regression — and remains a strong, interpretable baseline.', related: ['Linear Regression', 'Classification'] },
  { term: 'Confusion Matrix', aliases: ['confusion matrix', 'precision', 'recall', 'f1', 'f1 score', 'f1-score'], def: 'A table of predicted vs actual classes (TP, FP, FN, TN). Derived metrics: Precision = TP/(TP+FP), Recall = TP/(TP+FN), F1 = harmonic mean of both. Choose the metric that matches the real cost of errors — accuracy misleads on imbalanced data.', related: ['Classification', 'Cross-Validation'] },
  { term: 'Cross-Validation', aliases: ['cross-validation', 'cross validation', 'k-fold'], def: 'Evaluation technique: split data into K folds, train on K−1 and validate on the held-out fold, rotating K times. Gives a robust performance estimate and guards against a lucky/unlucky single split.', related: ['Overfitting', 'Confusion Matrix'] },
  { term: 'Bias-Variance Tradeoff', aliases: ['bias-variance', 'bias variance', 'bias-variance tradeoff'], def: 'Total error ≈ bias² + variance + noise. Simple models: high bias (systematic error), low variance. Complex models: low bias, high variance (sensitive to training data). Regularisation and ensembles navigate the tradeoff.', related: ['Overfitting', 'Underfitting'] },
  { term: 'Loss Function', aliases: ['loss function', 'loss', 'cost function', 'cross-entropy', 'mse'], def: 'The objective a model minimises during training: MSE for regression, cross-entropy for classification, contrastive losses for embeddings. The choice of loss encodes what “good” means for the task.', related: ['Gradient Descent'] },
  { term: 'Learning Rate', aliases: ['learning rate', 'lr'], def: 'The step size of gradient descent. The single most impactful hyperparameter: too large → divergence/oscillation, too small → painfully slow convergence. Schedules (warmup, cosine decay) and adaptive optimisers (Adam) manage it in practice.', related: ['Gradient Descent'] },
  { term: 'Activation Function', aliases: ['activation function', 'relu', 'sigmoid', 'softmax', 'activation'], def: 'The non-linearity applied after each neuron’s weighted sum — without it, stacked layers collapse into one linear map. ReLU max(0,x) dominates hidden layers; sigmoid squashes to (0,1); softmax turns logits into a probability distribution.', related: ['Neural Network'] },
  { term: 'Transfer Learning', aliases: ['transfer learning'], def: 'Reusing knowledge from a model trained on one task/domain for another — e.g. starting from ImageNet weights or a pretrained LLM. Slashes data and compute requirements; the default strategy in modern deep learning.', related: ['Fine-tuning'] },
  { term: 'Hallucination', aliases: ['hallucination', 'hallucinations'], def: 'When an LLM confidently generates false information — an artefact of next-token prediction without grounding. Mitigations: RAG, citations, tool use, refusal training and asking models to express uncertainty.', related: ['LLM', 'RAG'] },
  { term: 'API', aliases: ['api', 'rest', 'rest api', 'restful'], def: 'Application Programming Interface — a contract for software components to communicate. REST APIs expose resources over HTTP verbs (GET/POST/PUT/DELETE) with JSON payloads. NEKO’s backend exposes REST endpoints documented via OpenAPI.', related: ['FastAPI', 'JWT'] },
  { term: 'JWT', aliases: ['jwt', 'json web token', 'json web tokens'], def: 'JSON Web Token: a signed token (header.payload.signature) carrying claims like user id and expiry. The server verifies the HMAC/RSA signature statelessly — no session store needed. Used for NEKO’s authentication.', related: ['API', 'Hashing'] },
  { term: 'Hashing', aliases: ['hashing', 'hash', 'bcrypt', 'sha-256', 'password hashing'], def: 'One-way transformation of data to a fixed-size digest. Passwords are stored as salted slow hashes (bcrypt/argon2) so a database leak does not reveal credentials. Salting defeats rainbow tables; slowness defeats brute force.', related: ['JWT'] },
  { term: 'FastAPI', aliases: ['fastapi', 'fast api'], def: 'A modern async Python web framework built on Starlette + Pydantic. Type hints drive automatic request validation and OpenAPI docs. High performance and clean dependency injection — NEKO’s backend framework.', related: ['API', 'Pydantic'] },
  { term: 'Pydantic', aliases: ['pydantic'], def: 'Python library for data validation via type annotations. Defines schemas that parse and validate request/response bodies at runtime, giving FastAPI its automatic validation and serialisation.', related: ['FastAPI'] },
  { term: 'PostgreSQL', aliases: ['postgresql', 'postgres', 'sql'], def: 'A powerful open-source relational database with strong ACID guarantees, JSONB support and extensions like pgvector for embeddings. NEKO’s persistence layer, accessed through SQLAlchemy ORM.', related: ['API'] },
  { term: 'React', aliases: ['react', 'reactjs', 'react.js'], def: 'A JavaScript library for building UIs from declarative components. State changes re-render a virtual DOM diffed against the real DOM. Hooks (useState/useEffect) manage state and side effects. NEKO’s frontend framework, bundled by Vite.', related: ['API'] },
  { term: 'Intent Classification', aliases: ['intent classification', 'intent routing', 'intent detection', 'intent'], def: 'Mapping a user utterance to a predefined category of purpose (e.g. math, definition, task-creation) so it can be routed to a specialised handler. NEKO implements a scored rule/pattern classifier; production systems often use embeddings or fine-tuned classifiers.', related: ['NLP', 'LLM'] },
]

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim()
}

export function findConcept(query: string): Concept | null {
  const q = norm(query)
  if (!q) return null
  // exact alias match
  for (const c of KB) {
    if (c.aliases.includes(q) || norm(c.term) === q) return c
  }
  // alias contained in query (longest first)
  let best: { c: Concept; len: number } | null = null
  for (const c of KB) {
    for (const a of c.aliases) {
      if (a.length >= 3 && (q.includes(a) || a.includes(q))) {
        if (!best || a.length > best.len) best = { c, len: a.length }
      }
    }
  }
  return best?.c ?? null
}

export function relatedConcepts(query: string, n = 3): Concept[] {
  const q = new Set(norm(query).split(/\s+/))
  return KB.map((c) => {
    const words = new Set([...c.aliases.join(' ').split(/\s+/), ...norm(c.def).split(/\s+/)])
    let overlap = 0
    for (const w of q) if (w.length > 3 && words.has(w)) overlap++
    return { c, overlap }
  })
    .filter((x) => x.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, n)
    .map((x) => x.c)
}
