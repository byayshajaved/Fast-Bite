const menuGrid = document.querySelector("#menu-grid");
const menuStatus = document.querySelector("#menu-status");
const menuCount = document.querySelector("#menu-count");
const cartItemsElement = document.querySelector("#cart-items");
const cartEmptyElement = document.querySelector("#cart-empty");
const cartTotalElement = document.querySelector("#cart-total");
const cartCountElement = document.querySelector("#cart-count");
const headerCartCountElement = document.querySelector("#header-cart-count");
const checkoutButton = document.querySelector("#checkout-button");
const orderStatus = document.querySelector("#order-status");
const confirmationDialog = document.querySelector("#confirmation-dialog");
const confirmationLines = document.querySelector("#confirmation-lines");
const cart = new Map();

let menuItems = [];
let isSubmitting = false;

function formatPrice(amount) {
    return `Rs. ${Number(amount).toFixed(2)}`;
}

function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    if (text !== undefined) {
        element.textContent = text;
    }
    return element;
}

const menuImages = {
    "classic chicken burger": "static/images/Classic Chicken Burger.jpg",
    "zinger burger": "static/images/Zinger Burger.jpg",
    "beef burger": "static/images/Beef.jpg",
    "chicken wrap": "static/images/Chicken Wrap.jpg",
    "zinger wrap": "static/images/Zinger Wrap.jpg",
    "bbq wrap": "static/images/BBQ Wrap.jpg",
    "regular fries": "static/images/Regular Fries.jpg",
    "masala fries": "static/images/Masala Fries.jpg",
    "loaded fries": "static/images/Loaded Fries.jpg",
    "chicken nuggets (6 pieces)": "static/images/Nuggets.jpg",
    "chicken strips": "static/images/Strips.jpg",
    "chicken wings": "static/images/Wings.jpg",
    "fried chicken": "static/images/Fried Chicken.jpg",
    "soft drink": "static/images/Soft Drink.jpg",
    "lemonade": "static/images/Lemon.jpg",
    "mint margrita": "static/images/Mint.jpg",
    "mineral water": "static/images/Water.jpg",
    "brownie": "static/images/Brownie.jpg",
    "choclate lava cake": "static/images/Lava.jpg",
    "oreo shake": "static/images/Oreo.jpg",
};

function imageForItem(item) {
    const itemName = item.name.trim().toLowerCase();
    return menuImages[itemName] || "static/images/default.jpg";
}

function showMenuError(message) {
    menuStatus.textContent = message;
    menuStatus.hidden = false;
}

function renderMenu() {
    menuGrid.replaceChildren();
    menuCount.textContent = `${menuItems.length} items`;

    for (const item of menuItems) {
        const card = makeElement("article", "menu-card");
        const imageWrap = makeElement("div", "menu-image-wrap");
        const image = makeElement("img", "menu-image");
        image.src = imageForItem(item);
        image.alt = item.name;
        image.loading = "lazy";
        imageWrap.append(image);

        const cardBody = makeElement("div", "menu-card-body");
        const name = makeElement("h3", "menu-item-name", item.name);
        const footer = makeElement("div", "menu-card-footer");
        const price = makeElement("span", "menu-item-price", formatPrice(item.price));
        const addButton = makeElement("button", "add-button");
        addButton.type = "button";
        addButton.disabled = isSubmitting;
        addButton.setAttribute("aria-label", `Add ${item.name} to your order`);
        addButton.append(makeElement("span", "", "Add"));
        addButton.append(makeElement("span", "", "+"));
        addButton.addEventListener("click", () => changeQuantity(item.menu_item_id, 1));
        footer.append(price, addButton);
        cardBody.append(name, footer);
        card.append(imageWrap, cardBody);
        menuGrid.append(card);
    }
}

function changeQuantity(menuItemId, change) {
    const newQuantity = (cart.get(menuItemId) || 0) + change;
    if (newQuantity < 1) {
        cart.delete(menuItemId);
    } else {
        cart.set(menuItemId, newQuantity);
    }
    renderCart();
}

function renderCart() {
    cartItemsElement.replaceChildren();
    cartEmptyElement.hidden = cart.size > 0;

    let totalQuantity = 0;
    let estimatedTotal = 0;

    for (const [menuItemId, quantity] of cart) {
        const item = menuItems.find((menuItem) => menuItem.menu_item_id === menuItemId);
        if (!item) {
            continue;
        }

        totalQuantity += quantity;
        estimatedTotal += Number(item.price) * quantity;

        const row = makeElement("div", "cart-line");
        const name = makeElement("p", "cart-line-name", item.name);
        const lineTotal = makeElement("span", "cart-line-price", formatPrice(Number(item.price) * quantity));
        const controls = makeElement("div", "quantity-control");
        const decreaseButton = makeElement("button", "", "-");
        decreaseButton.type = "button";
        decreaseButton.disabled = isSubmitting;
        decreaseButton.setAttribute("aria-label", `Remove one ${item.name}`);
        decreaseButton.addEventListener("click", () => changeQuantity(menuItemId, -1));
        const quantityValue = makeElement("span", "quantity-value", String(quantity));
        const increaseButton = makeElement("button", "", "+");
        increaseButton.type = "button";
        increaseButton.disabled = isSubmitting;
        increaseButton.setAttribute("aria-label", `Add one ${item.name}`);
        increaseButton.addEventListener("click", () => changeQuantity(menuItemId, 1));
        controls.append(decreaseButton, quantityValue, increaseButton);
        row.append(name, lineTotal, controls);
        cartItemsElement.append(row);
    }

    cartCountElement.textContent = String(totalQuantity);
    headerCartCountElement.textContent = String(totalQuantity);
    cartTotalElement.textContent = formatPrice(estimatedTotal);
    checkoutButton.disabled = cart.size === 0 || isSubmitting;
    checkoutButton.firstElementChild.textContent = isSubmitting ? "Placing order..." : "Place order";
}

function showConfirmation(order) {
    document.querySelector("#confirmation-order-id").textContent = `#${order.order_id}`;
    document.querySelector("#confirmation-total").textContent = formatPrice(order.total_amount);
    confirmationLines.replaceChildren();

    for (const item of order.items) {
        const line = makeElement("div", "confirmation-line");
        line.append(
            makeElement("span", "", `${item.quantity} x ${item.item_name}`),
            makeElement("span", "", formatPrice(item.line_total)),
        );
        confirmationLines.append(line);
    }

    confirmationDialog.showModal();
}

async function loadMenu() {
    try {
        const response = await fetch("/api/menu");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "The menu could not be loaded.");
        }
        if (!Array.isArray(data)) {
            throw new Error("The menu response was not a list.");
        }

        menuItems = data;
        if (menuItems.length === 0) {
            showMenuError("No menu items are currently available.");
        } else {
            menuStatus.hidden = true;
        }
        renderMenu();
        renderCart();
    } catch (error) {
        showMenuError(error.message);
    }
}

async function placeOrder() {
    if (cart.size === 0 || isSubmitting) {
        return;
    }

    isSubmitting = true;
    orderStatus.textContent = "";
    orderStatus.classList.remove("error");
    renderMenu();
    renderCart();

    try {
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                items: Array.from(cart, ([menu_item_id, quantity]) => ({ menu_item_id, quantity })),
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "The order could not be placed.");
        }

        cart.clear();
        showConfirmation(data);
    } catch (error) {
        orderStatus.textContent = error.message;
        orderStatus.classList.add("error");
    } finally {
        isSubmitting = false;
        renderMenu();
        renderCart();
    }
}

checkoutButton.addEventListener("click", placeOrder);
document.querySelector("#new-order-button").addEventListener("click", () => confirmationDialog.close());

loadMenu();
