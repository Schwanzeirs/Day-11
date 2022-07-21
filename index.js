// import express
const { application } = require('express');
const express = require('express');
const req = require('express/lib/request');
const res = require('express/lib/response');
const bcrypt = require('bcrypt');
const flash = require('express-flash')
const session = require('express-session')

// pemanggilan koneksi db
const db = require('./connection/db');

// use express
const app = express()


// request =  client -> server
// response = server -> client

// set default view engine
app.set('view engine', 'hbs');

// static folder
app.use('/public', express.static('public'))

app.use(flash())

app.use(
    session({
        cookie: {
            httpOnly: true,
            secure: false,
            maxAge: 1000 * 60 * 60 * 2
        },
        store: new session.MemoryStore(),
        saveUninitialized: true,
        resave: false,
        secret: 'secretValue'
    })
)

// body parser
app.use(express.urlencoded({ extended: false }))

let month = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
]


// get = mengirimkan request, tanpa ada info yang dikirimkan
// post = mengirimkan request, beserta adanya ingfo yang dikirimkan

const isLogin = true

// root endpoint
app.get('/', function (req, res) {
    let title = "Personal Web"
    res.render('index', { title })
})

app.get('/contact', function (req, res) {
    res.render('contact-me')
})

app.get('/project', function (req, res) {

    if (!isLogin) {
        return res.redirect('/')
    }

    res.render('my-project')
})

app.get('/delete-project/:id', function (req, res) {
    let id = req.params.id

    db.connect((err, client, done) => {
        if (err) throw err

        let queryDelete = `DELETE FROM projects WHERE id=${id}`

        client.query(queryDelete, (err, result) => {
            done()
            if (err) throw err

            res.redirect('/list')
        })
    })
})

app.get('/edit-project/:id', function (req, res) {
    let id = req.params.id

    db.connect((err, client, done) => {
        if (err) throw err

        let queryDelete = `SELECT * FROM projects WHERE id=${id}`

        client.query(queryDelete, (err, result) => {
            done()
            if (err) throw err

            res.render('edit-project', { data: result.rows[0] })

        })

    })
})

app.post('/edit-project', function (req, res) {
    let { id, title, startDate, endDate, description, node, next, react, type } = req.body
    let date = new Date()


    db.connect((err, client, done) => {
        if (err) throw err

        let queryUpdate = `UPDATE projects SET title='${title}', "startDate"='${startDate}', "endDate"='${endDate}', description='${description}', node='${node}', next='${next}', react='${react}', type='${type}' WHERE id=${id}`

        client.query(queryUpdate, (err, result) => {
            // done()
            if (err) throw err

            res.redirect('/list')
        })
    })
})

app.get('/detail', function (req, res) {
    res.render('project-detail')
})

app.post('/list', function (req, res) {

    let { title, startDate, endDate, description, node, react, next, type } = req.body


    let project = {
        authorId: 34,
        title,
        startDate,
        endDate,
        description,
        node,
        next,
        react,
        type
    }

    console.log(project);

    db.connect((err, client, done) => {
        if (err) throw err

        let queryAdd = `INSERT INTO projects("authorId", title, "startDate", "endDate", description, node, next, react, type) VALUES
                            ('${project.authorId}', '${project.title}', '${project.startDate}', '${project.endDate}', '${project.description}', '${project.node}', '${project.next}', '${project.react}', '${project.type}' )`

        client.query(queryAdd, (err, result) => {
            done()
            if (err) throw err
            res.redirect('/list')
        })
    })

})

app.get('/list', function (req, res) {

    let selectQuery = 'SELECT * FROM projects'

    db.connect((err, client, done) => {
        if (err) throw err

        client.query(selectQuery, (err, result) => {
            done()
            if (err) throw err

            let dataProjects = result.rows

            dataProjects = dataProjects.map((project) => {
                return {
                    ...project,
                    createdAt: getFullTime(project.createdAt),
                    startDate: getFullTime(project.startDate),
                    endDate: getFullTime(project.endDate)
                }
            })

            res.render('project-list', {
                isLogin,
                project: dataProjects
            })
        })
    })


})

app.get('/list/:id', function (req, res) {
    let id = req.params.id

    let queryDetail = `SELECT * FROM projects WHERE id=${id}`

    db.connect((err, client, done) => {
        if (err) throw err

        client.query(queryDetail, (err, result) => {
            done()
            if(err) throw err

            res.render('project-detail', { data: result.rows[0] })

        })
    })

})

app.get('/login', function (req, res) {
    res.render('login')
})

app.get('/register', function (req, res) {
    res.render('register')
})

app.post('/register', function (req, res) {
    let { name, email, password } = req.body

    console.log(name, email, password);

    password = bcrypt.hashSync(password, 10);

    let queryCheckEmail = `SELECT * FROM users WHERE email='${email}'`

    let query = `INSERT INTO users(name, email, password) VALUES
                    ('${name}', '${email}', '${password}')`

    db.connect((err, client, done) => {
        if(err) throw err

        client.query(queryCheckEmail, (err, result) => {
            if(err) throw err

            if (result.rowCount != 0) {
                return res.redirect('/register')
            }
            
        })

        client.query(query, (err, result) => {
            done()
            if(err) throw err

            res.redirect('/login')
        })
    })
})

app.post('/login', function (req, res) {
    let { email, password } = req.body

    db.connect((err, client, done) => {
        if(err) throw err
        
        let queryCheckEmail = `SELECT * FROM users WHERE email='${email}'`

        client.query(queryCheckEmail, (err, result) => {
            if(err) throw err

            if(result.rowCount == 0) {
                // req.flash('danger', 'Email not found')

                return res.redirect('/login')
            }

            let isMatch = bcrypt.compareSync(password, result.rows[0].password)

            if (isMatch) {
                req.session.isLogin = true
                req.session.user = {
                    name: result.rows[0].name,
                }
                // req.flash('success', 'Login success')
                res.redirect('/list')
            } else {
                // req.flash('danger', 'Email and password doesnt match')

                res.redirect('/login')
            }
        })
    })

})

function getFullTime(time) {
    let date = time.getDate()
    let monthIndex = time.getMonth()
    let year = time.getFullYear()

    let hour = time.getHours()
    let minute = time.getMinutes()

    return `${date} ${month[monthIndex]} ${year} ${hour}:${minute} WIB`
}

function getDistanceTime(time) {

    let distance = new Date() - new Date(time)

    let miliseconds = 1000
    let secondInMinutes = 60
    let minuteInHour = 60
    let secondInHour = secondInMinutes * minuteInHour //3600
    let hourInDay = 23

    let dayDistance = distance / (miliseconds * secondInHour * hourInDay)


    if (dayDistance >= 1) {
        const dayDate = Math.floor(dayDistance) + ' day ago'
        return dayDate
    } else {
        let hourDistance = Math.floor(distance / (miliseconds * secondInHour))
        if (hourDistance > 0) {
            return hourDistance + ' hour ago'
        } else {
            let minuteDistance = Math.floor(distance / (miliseconds * secondInMinutes))
            if (minuteDistance > 0) {
                return minuteDistance + ' minute ago'
            } else {
                let secondDistance = Math.floor(distance / miliseconds)
                return secondDistance + ' second ago'
            }
        }
    }
}

// port
const port = 5000
app.listen(port, function () {
    console.log(`server running on port : ${port}`);
})