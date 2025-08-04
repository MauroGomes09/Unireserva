# Unireserva

Trabalho da disciplina de **Redes de Computadores** do curso de **Ciência da Computação** da **Universidade Federal de Pelotas (UFPEL)**, ministrada pelo professor **Guilherme Corrêa**.

---

## Descrição do Projeto

O Unireserva é um sistema web para reserva de salas e laboratórios, desenvolvido como atividade prática para aplicar conceitos de redes, comunicação cliente-servidor e integração de sistemas web modernos.

O sistema permite:
- Visualizar salas e horários disponíveis
- Reservar horários em salas específicas
- Visualizar reservas por data

A aplicação é composta por:
- **Frontend**: Desenvolvido em Next.js (React)
- **Backend**: Servidor Python (HTTPServer) que gerencia as reservas e persistência em arquivo JSON

---

## Como Executar

### 1. Inicie o servidor backend (Python)

```bash
python server.py
```

O servidor será iniciado em `http://127.0.0.1:5000`.

### 2. Inicie o frontend (Next.js)

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

---

## Estrutura do Projeto

- `server.py`: Servidor Python responsável pela API de reservas
- `rooms.json`: Persistência das reservas
- `src/`: Código-fonte do frontend (Next.js)
- `public/`: Assets estáticos

---

## Tecnologias Utilizadas

- [Next.js](https://nextjs.org/) 15+
- [React](https://react.dev/) 19+
- [Python](https://www.python.org/) 3+
- HTTPServer (biblioteca padrão Python)

---

## Créditos

Desenvolvido por estudantes da disciplina de Redes de Computadores — Ciência da Computação — UFPEL

Professor: Guilherme Corrêa

---

## Observações

- O backend deve estar rodando para o frontend funcionar corretamente.
- As reservas são persistidas no arquivo `rooms.json`.
- O projeto pode ser adaptado para outros contextos de reserva de recursos.
