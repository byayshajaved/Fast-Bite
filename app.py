from dotenv import load_dotenv
load_dotenv()

import mysql.connector
from flask import Flask, jsonify, render_template, request

from fastbite_db import get_menu_items, save_order

app = Flask(__name__)


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/api/menu")
def api_menu():
    try:
        menu_items = get_menu_items()
    except (mysql.connector.Error, RuntimeError) as error:
        return jsonify({"error": str(error)}), 503

    return jsonify(
        [
            {
                "menu_item_id": item["menu_item_id"],
                "name": item["name"],
                "price": format(item["price"], ".2f"),
            }
            for item in menu_items
        ]
    )


@app.post("/api/orders")
def api_create_order():
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not isinstance(data.get("items"), list):
        return jsonify({"error": "Provide an items list."}), 400

    order_items = []
    for item in data["items"]:
        if not isinstance(item, dict):
            return jsonify({"error": "Each item must include an ID and quantity."}), 400

        menu_item_id = item.get("menu_item_id")
        quantity = item.get("quantity")
        if (
            not isinstance(menu_item_id, int)
            or isinstance(menu_item_id, bool)
            or not isinstance(quantity, int)
            or isinstance(quantity, bool)
            or quantity < 1
        ):
            return jsonify({"error": "Item IDs and positive whole-number quantities are required."}), 400

        order_items.append((menu_item_id, quantity))

    if not order_items:
        return jsonify({"error": "Add at least one item before placing the order."}), 400

    try:
        saved_order = save_order(order_items)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except (mysql.connector.Error, RuntimeError):
        return jsonify({"error": "The order could not be saved. Please try again."}), 500

    return (
        jsonify(
            {
                "order_id": saved_order["order_id"],
                "total_amount": format(saved_order["total_amount"], ".2f"),
                "items": [
                    {
                        "menu_item_id": item["menu_item_id"],
                        "item_name": item["item_name"],
                        "unit_price": format(item["unit_price"], ".2f"),
                        "quantity": item["quantity"],
                        "line_total": format(item["line_total"], ".2f"),
                    }
                    for item in saved_order["items"]
                ],
            }
        ),
        201,
    )


if __name__ == "__main__":
    app.run()
