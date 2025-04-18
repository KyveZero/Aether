const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const rateLimiter = require('express-rate-limit');
const compression = require('compression');

app.use(compression({
    level: 5,
    threshold: 0,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));
app.set('view engine', 'ejs');
app.set('trust proxy', 1);
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept',
    );
    console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url} - ${res.statusCode}`);
    next();
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100, headers: true }));

app.all('/player/growid/checktoken', function (req, res) {
    const valKey = req.query.valKey;
    if (!valKey) {
        return res.status(400).json({ status: 'error', message: 'Missing validation key' });
    }
    // Validate the key here
    res.json({ status: 'success', message: 'Token validated' });
});

app.all('/player/login/dashboard', function (req, res) {
    const valKey = req.query.valKey;
    const tData = {};
    
    if (valKey) {
        // Process validation key if present
        tData.valKey = valKey;
    }
    
    try {
        const uData = JSON.stringify(req.body).split('"')[1].split('\\n');
        const uName = uData[0].split('|');
        const uPass = uData[1].split('|');
        for (let i = 0; i < uData.length - 1; i++) {
            const d = uData[i].split('|');
            tData[d[0]] = d[1];
        }
        if (uName[1] && uPass[1]) {
            res.redirect('/player/growid/login/validate');
        }
    } catch (why) {
        console.log(`Warning: ${why}`);
    }

    res.render(__dirname + '/public/html/dashboard.ejs', { data: tData });
});

app.all('/player/growid/login', (req, res) => {
    const token = req.query.token;
    if (!token) {
        return res.status(400).json({ status: 'error', message: 'Missing token' });
    }
    // Validate token here
    res.redirect('/player/login/dashboard?valKey=' + token);
});

app.all('/player/growid/login/validate', (req, res) => {
    const _token = req.body._token;
    const growId = req.body.growId;
    const password = req.body.password;

    const token = Buffer.from(
        `_token=${_token}&growId=${growId}&password=${password}`,
    ).toString('base64');

    res.send(
        `{"status":"success","message":"Account Validated.","token":"${token}","url":"","accountType":"growtopia"}`,
    );
});

app.all('/player/link/dashboard/validate/:token', (req, res) => {
    const token = req.params.token;
    if (!token) {
        return res.status(400).json({ status: 'error', message: 'Missing token' });
    }
    // Validate token here
    res.json({ status: 'success', message: 'Dashboard validated' });
});

app.all('/player/*', function (req, res) {
    res.status(301).redirect('https://api.yoruakio.tech/player/' + req.path.slice(8));
});

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.listen(5000, function () {
    console.log('Listening on port 5000');
});
