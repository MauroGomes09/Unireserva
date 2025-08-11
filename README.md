# UniReserva

Trabalho da disciplina de **Redes de Computadores** do curso de **Ciência da Computação** da **Universidade Federal de Pelotas (UFPEL)**, ministrada pelo professor **Guilherme Corrêa**.

---

## Créditos

Desenvolvido por Pedro, Rafael e Mauro da disciplina de Redes de Computadores — Ciência da Computação — UFPEL

Professor: Guilherme Corrêa

## Descrição do Projeto

O UniReserva é um sistema web para reserva de salas e laboratórios, desenvolvido como atividade prática para aplicar conceitos de redes, comunicação cliente-servidor e integração de sistemas web modernos.

O sistema permite:
- Visualizar salas e horários disponíveis
- Reservar horários em salas específicas
- Visualizar reservas por data

A aplicação é composta por:
- **Frontend**: Desenvolvido em Next.js (React)
- **Backend**: Servidor Python com TLS que gerencia as reservas

---

## Como Executar

### 1. Gerar certificados SSL

```bash
python setup_ssl.py
```

### 2. Inicie o servidor backend (Python com TLS)

```bash
python server.py
```

O servidor será iniciado em `https://127.0.0.1:5000`.

### 3. Inicie o frontend (Next.js com HTTPS)

```bash
npm install
npm run dev -- --experimental-https
```

Acesse [https://localhost:3000](https://localhost:3000) no navegador.

---

## Estrutura do Projeto

- `server.py`: Servidor Python com TLS responsável pela API de reservas
- `rooms.json`: Persistência das reservas
- `src/`: Código-fonte do frontend (Next.js)
- `public/`: Assets estáticos

---

## Tecnologias Utilizadas

- [Next.js](https://nextjs.org/) 15+
- [React](https://react.dev/) 19+
- [Python](https://www.python.org/) 3+
- HTTPServer + SSL

---

## Observações

- O backend deve estar rodando para o frontend funcionar corretamente.
- As reservas são persistidas no arquivo `rooms.json`.
- Sistema utiliza TLS para comunicação segura.

