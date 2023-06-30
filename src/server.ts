import express from "express";
import axios from "axios";

const app = express();
const port = 8000;

app.use(express.json());
const router = express.Router();
let api_key = 'Zf0E0azedulQuZTTxs4FebI0VrmtRufv3WQ2ymCn';

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
