import express from "express";
import axios from "axios";

const app = express();
const port = 8000;

app.use(express.json());
const router = express.Router();
let api_key = 'Zf0E0azedulQuZTTxs4FebI0VrmtRufv3WQ2ymCn';

const Pool = require('pg').Pool
const pool = new Pool({
    user: 'MarPat',
    host: 'localhost',
    database: 'MarsAPI',
    password: 'password',
    port: 5432,
})

function check_rover_camera(rover: string, camera: string) {
    return (rover == 'curiosity' && (camera == 'pancam' || camera == 'minites')) ||
        (rover == 'opportunity' || rover == 'spirit') && (camera == 'mast' || camera == 'chemcam' || camera == 'mahli' || camera == 'mardi');
}

router.get('/test', (req, res) => res.send('Hello world !'));

router.get('/rovers', async (req, res) => {
    let nasa_url = `https://api.nasa.gov/mars-photos/api/v1/rovers/?api_key=${api_key}`;
    let response = await axios.get(nasa_url);
    let rovers = response.data;
    res.send(rovers);

    for (let i = 0; i < rovers['rovers'].length; i++) {
        let name = rovers['rovers'][i].name;
        let id = rovers['rovers'][i].id;
        let landing_date = rovers['rovers'][i].landing_date;
        let launch_date = rovers['rovers'][i].launch_date;
        let status = rovers['rovers'][i].status;
        let max_sol = rovers['rovers'][i].max_sol;
        let max_date = rovers['rovers'][i].max_date;
        let total_photos = rovers['rovers'][i].total_photos;

        // @ts-ignore
        pool.query('SELECT * FROM rovers WHERE id = $1', [id], (err, results) => {
            if (results.rows.length == 0) {
                pool.query('insert into rovers values ($1, $2, $3, $4, $5, $6, $7, $8)', [id, name, landing_date, launch_date, status, max_sol, max_date, total_photos]);
            }
        })

        let cameras = rovers['rovers'][i].cameras;
        let camera_ids: number[] = [];
        for (let j = 0; j < cameras.length; j++) {
            let camera_id = cameras[j].id;
            let camera_name = cameras[j].name;
            let rover_id = cameras[j].rover_id;
            let camera_full_name = cameras[j].full_name;

            // @ts-ignore
            pool.query('SELECT * FROM cameras WHERE id = $1', [camera_id], (err, results) => {
                if (results.rows.length == 0) {
                    pool.query('insert into cameras values ($1, $2, $3, $4)', [camera_id, camera_name, rover_id, camera_full_name]);
                }
            })

            camera_ids.push(camera_id);
        }

        for (let i = 0; i < camera_ids.length; i++) {
            // @ts-ignore
            pool.query('SELECT * FROM rovers_cameras WHERE rover_id = $1 and camera_id = $2', [id, camera_ids[i]], (err, results) => {
                if (results.rows.length == 0) {
                    pool.query('insert into rovers_cameras values ($1, $2)', [id, camera_ids[i]]);
                }
            })
        }
    }

});

router.get('/rovers/photos/sol/page', async (req, res) => {
    let body = req.body;

    let rover: string = body.rover;
    let camera: string = body.camera;
    let sol: string = body.sol;
    let page: string = body.page;

    if (check_rover_camera(rover, camera)) {
        res.send(`Rover ${rover} did not capture images with camera ${camera}.`);

    } else {
        try {
            let nasa_url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?sol=${sol}&page=${page}&camera=${camera}&api_key=${api_key}`;
            let response = await axios.get(nasa_url);
            let photos = response.data['photos'];

            if (photos.length == 0) {
                res.send(`No data available for sol ${sol}. Try changing this value.`);

            } else {
                let trimmed_output = [];
                let limit;

                if (photos.length <= 10) {
                    limit = photos.length;
                } else {
                    limit = 10;
                }
                for (let i = 0; i < limit; i++) {
                    if (photos[i]) {
                        trimmed_output.push(photos[i]);
                    }
                }

                res.send(trimmed_output);
            }
        }
        catch (e) {
            res.send(e);
        }
    }
});

router.get('/rovers/photos/sol/interval', async (req, res) => {
    let body = req.body;

    let rover: string = body.rover;
    let camera: string = body.camera;
    let sol: string = body.sol;
    let paginationStart: number = +body.paginationStart;
    let paginationEnd: number = +body.paginationEnd;

    if (check_rover_camera(rover, camera)) {
        res.send(`Rover ${rover} did not capture images with camera ${camera}.`);

    } else {
        try {
            let nasa_url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?sol=${sol}&camera=${camera}&api_key=${api_key}`;
            let response = await axios.get(nasa_url);
            let photos = response.data['photos'];

            if (photos.length == 0) {
                res.send(`No data available for sol ${sol}. Try changing this value.`);

            } else {
                try {
                    let trimmed_photos = [];
                    for (let i = paginationStart; i <= paginationEnd; i++) {
                        if (photos[i]) {
                            trimmed_photos.push(photos[i]);
                        }
                    }
                    res.send(trimmed_photos);
                }
                catch (e: any) {
                    res.send(`Output could not be displayed because of error ${e.message}`);
                }
            }
        }
        catch (e: any) {
            res.send(`Photos could not be retrieved: ${e.message}`);
        }
    }
});

app.use('/', router);

app.listen(port, () => {
    console.log(`Test backend is running on port ${port}`);
});
