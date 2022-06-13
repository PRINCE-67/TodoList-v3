//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _= require("lodash");

const app = express();

app.use(bodyParser());

app.use(express.static("public"));
app.set("view engine", "ejs");

//created a todolistDB in mongodb server
mongoose.connect("mongodb+srv://admin-prince:test123@cluster0.qerbh.mongodb.net/todolistDB");

// created a schema for collections
const itemsSchema = {
  name: String
};

// created a collection called Item having its structure as itemsSchema
const Item = mongoose.model("Item", itemsSchema);

// creating the documents in collection
const item1 = new Item({
  name: "Welcome to todolist."
});

const item2 = new Item({
  name: "+ to add item."
});

const item3 = new Item({
  name: "Tick the checkbox to delete item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = new mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err)
          console.log(err);
        else
          console.log("inserted items successfully.");
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});

app.get("/:customListName", function(req, res) {

  const customListName = _.capitalize(req.params.customListName);
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});

app.post("/", function(req, res) {
  const newItem = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: newItem
  });
  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+ listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName=req.body.list;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err){
        console.log("Deleted the element successfully.");
        res.redirect("/");
      }
    });
  }
  else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id: checkedItemId}}},function(err,foundList){
      if(!err){
        res.redirect("/"+ listName);
      }
    });
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000.");
});
