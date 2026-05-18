const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jungle Gaming - Crash Game 🎮</title>

</head>
<body>
    <header>
        <div>
            <span>🦧</span> Jungle Gaming
        </div>
    </header>
</body>
</html>`;

const server = Bun.serve({
    port: 3000,
    fetch(req) {
        return new Response(html, {
            headers: {
                "content-type": "text/html; charset=utf-8",
            },
        });
    },
});

console.log(`Server started on port ${server.port}`);
