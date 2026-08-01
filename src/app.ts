import express from 'express';

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT ?? 5000;

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});