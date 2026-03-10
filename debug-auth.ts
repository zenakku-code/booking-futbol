import { auth } from './src/lib/auth';

async function main() {
    try {
        console.log("Initializing auth...");
        // Forcing initialization or a dummy request
        const res = await auth.handler(new Request("http://localhost:3000/api/auth/get-session"));
        console.log(res);
    } catch (e) {
        console.error("Caught error:");
        console.error(e);
    }
}

main();
