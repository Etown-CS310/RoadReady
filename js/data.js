/*
 * Temporary RoadReady frontend data.
 *
 * This replaces the database while the frontend is being built.
 *
 * Later:
 * - vehicles will come from the backend
 * - maintenance will come from the backend
 * - history will come from the backend
 * - guides will come from the backend
 */

const roadReadyData = {

    user: {
        name: "Sam Vossen"
    },

    vehicles: [
        {
            id: 1,
            year: 2003,
            make: "Acura",
            model: "TL",
            nickname: "Daily Driver",
            trim: "3.2",
            engine: "3.2L V6",
            transmission: "Automatic",
            bodyType: "Sedan",
            mileage: 142350,
            vin: "19UUA56803A000000",
            image: ""
        },

        {
            id: 2,
            year: 2020,
            make: "Toyota",
            model: "RAV4",
            nickname: "Family SUV",
            trim: "XLE",
            engine: "2.5L I4",
            transmission: "Automatic",
            bodyType: "SUV",
            mileage: 68320,
            vin: "2T3P1RFV0LW000000",
            image: ""
        }
    ],

    maintenance: [
        {
            id: 1,
            vehicleId: 1,
            name: "Oil Change",
            detail: "Due at 145,000 miles • Oct 15, 2026",
            status: "soon"
        },

        {
            id: 2,
            vehicleId: 1,
            name: "Brake Inspection",
            detail: "Due at 150,000 miles",
            status: "good"
        },

        {
            id: 3,
            vehicleId: 1,
            name: "Tire Rotation",
            detail: "Due at 144,000 miles",
            status: "overdue"
        },

        {
            id: 4,
            vehicleId: 2,
            name: "Oil Change",
            detail: "Due at 70,000 miles",
            status: "good"
        }
    ],

    history: [
        {
            id: 1,
            vehicleId: 1,
            date: "Sep 2, 2026",
            service: "Oil Change",
            mileage: 137500,
            cost: 59.99,
            shop: "RoadReady Auto",
            notes: "Synthetic oil"
        },

        {
            id: 2,
            vehicleId: 1,
            date: "Jun 18, 2026",
            service: "Tire Rotation",
            mileage: 134200,
            cost: 25.00,
            shop: "RoadReady Auto",
            notes: ""
        },

        {
            id: 3,
            vehicleId: 1,
            date: "Mar 4, 2026",
            service: "Brake Inspection",
            mileage: 129800,
            cost: 0,
            shop: "RoadReady Auto",
            notes: "Brakes inspected"
        },

        {
            id: 4,
            vehicleId: 2,
            date: "Aug 12, 2026",
            service: "Oil Change",
            mileage: 65000,
            cost: 64.99,
            shop: "Toyota Service",
            notes: ""
        }
    ],

    guides: [
        {
            id: 1,
            category: "Oil Change",
            title: "Why Oil Changes Matter",
            summary: "Regular oil changes help keep your engine lubricated and operating efficiently.",

            body: `
                Engine oil lubricates the moving components inside your engine.

                Over time, oil becomes contaminated and loses some of its ability
                to protect engine components.

                Following the recommended service interval helps maintain engine
                performance and can reduce unnecessary wear.
            `,

            risks: `
                Skipping oil changes can increase engine wear, reduce lubrication,
                and potentially contribute to expensive engine damage.
            `
        },

        {
            id: 2,
            category: "Brakes",
            title: "Brake Maintenance",
            summary: "Your braking system is one of the most important safety systems on your vehicle.",

            body: `
                Brake components experience wear every time the vehicle slows down.

                Brake pads, rotors, fluid, and other components should be inspected
                regularly.

                Warning signs can include squealing, grinding, vibration, or
                changes in pedal feel.
            `,

            risks: `
                Ignoring brake problems can increase stopping distance and may
                result in additional component damage.
            `
        },

        {
            id: 3,
            category: "Tires",
            title: "Tire Maintenance",
            summary: "Proper tire maintenance helps with safety, handling, and fuel economy.",

            body: `
                Tires should be checked regularly for tread wear, damage, and
                proper inflation.

                Rotating tires according to the manufacturer's recommended
                interval can help promote even wear.
            `,

            risks: `
                Neglected tires can wear unevenly and may negatively affect
                vehicle handling and braking.
            `
        }
    ]

};
