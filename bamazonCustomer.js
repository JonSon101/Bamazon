var mysql = require('mysql');
var inquirer = require('inquirer');

//setup connection to database
var connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'bamazon'
});

//connect to database
connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id", connection.threadId);

    queryAllProducts();
});

//print all products in terminal
function queryAllProducts() {
    connection.query("SELECT * FROM products", function(err, res) {
        if (err) throw err;
        for (var i = 0; i < res.length; i++) {
            console.log("item_id: " + res[i].item_id);
            console.log("product_name: " + res[i].product_name);
            console.log("price: $" + res[i].price, "\n");
        }
        promptUser();
    });
}

//prompt user for purchase information
function promptUser() {
    inquirer.prompt([
        {
            name: "idInput",
            type: "input",
            message: "Enter the ID of the product you would like to purchase:"
        },
        {
            name: "quantityInput",
            type: "input",
            message: "Enter the quantity you would like to purchase:"
        }
    ])
    .then(function(answer) {
        checkQuantity(answer.idInput, answer.quantityInput);
    });
}

//check the selected quantity against database.
function checkQuantity(idInput, quantityInput) {
    connection.query("SELECT item_id, product_name, stock_quantity FROM products WHERE item_id = ?", [idInput], function(err, res) {
        if (err) throw err;
        if (quantityInput <= res[0].stock_quantity) {
            processOrder(idInput, res[0].stock_quantity - quantityInput);
            displayTotalCost(idInput, quantityInput);
        } else if (quantityInput > res[0].stock_quantity) {
            console.log("\nInsufficient Quantity of " + res[0].product_name + "\n");
            reset();
        }
    });
}

//if quantity is good, update database to new quantity
function processOrder(idInput, newQuantity) {
    console.log("\nProcessing Order...");
    connection.query("UPDATE products SET stock_quantity = ? WHERE item_id = ?", [newQuantity, idInput], function(err, res) {
        if (err) throw err;
        console.log("\nYour purchase has been completed!");
    });
}

//display total cost of purchased product
function displayTotalCost(idInput, quantityInput) {
    connection.query("SELECT product_name, price FROM products WHERE item_id = ?", [idInput], function(err, res) {
        if (err) throw err;
        console.log("\nTotal cost of " + res[0].product_name + " is $" + (quantityInput * res[0].price).toFixed(2) + "\n");
        reset();
    });
}

//reset application
function reset() {
    inquirer.prompt([
        {
            name: "resetInput",
            type: "confirm",
            message: "Would you like to make another purchase?"
        }
    ]).then(function(response) {
        if (response.resetInput) {
            queryAllProducts();
        } else {
            console.log("\nThank You!\n");
            connection.end();
        }
    });
}