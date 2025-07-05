import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const users = [];
  for (let i = 0; i < 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        password: 'password123', // In a real app, hash this
        role: faker.helpers.arrayElement(['ADMIN', 'MANAGER', 'EMPLOYEE', 'DRIVER']),
      },
    });
    users.push(user);
  }
  console.log(`${users.length} users created.`);

  // Create Categories
  const categories = [];
  for (let i = 0; i < 5; i++) {
    const category = await prisma.category.create({
      data: {
        name: faker.commerce.department(),
        description: faker.lorem.sentence(),
      },
    });
    categories.push(category);
  }
  console.log(`${categories.length} categories created.`);

  // Create Suppliers
  const suppliers = [];
  for (let i = 0; i < 5; i++) {
    const supplier = await prisma.supplier.create({
      data: {
        name: faker.company.name(),
        contactName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
      },
    });
    suppliers.push(supplier);
  }
  console.log(`${suppliers.length} suppliers created.`);

  // Create Products
  const products = [];
  for (let i = 0; i < 20; i++) {
    const product = await prisma.product.create({
      data: {
        sku: `SKU-${faker.string.uuid()}`,
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        categoryId: faker.helpers.arrayElement(categories).id,
        supplierId: faker.helpers.arrayElement(suppliers).id,
        unitPrice: parseFloat(faker.commerce.price()),
      },
    });
    products.push(product);
  }
  console.log(`${products.length} products created.`);

  // Create Locations
  const locations = [];
  for (let i = 0; i < 3; i++) {
    const location = await prisma.location.create({
      data: {
        name: `${faker.location.city()} Warehouse`,
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        type: faker.helpers.arrayElement(['WAREHOUSE', 'STORE']),
      },
    });
    locations.push(location);
  }
  console.log(`${locations.length} locations created.`);

  // Create Inventory
  const inventory = [];
  for (const product of products) {
    for (const location of locations) {
      const inv = await prisma.inventory.create({
        data: {
          productId: product.id,
          locationId: location.id,
          quantity: faker.number.int({ min: 0, max: 1000 }),
          reorderPoint: 50,
        },
      });
      inventory.push(inv);
    }
  }
  console.log(`${inventory.length} inventory records created.`);

  // Create Orders
  const orders = [];
  for (let i = 0; i < 15; i++) {
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${faker.string.uuid()}`,
        customerId: faker.helpers.arrayElement(users).id,
        locationId: faker.helpers.arrayElement(locations).id,
        orderType: 'SALES',
        status: faker.helpers.arrayElement(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED']),
        totalAmount: parseFloat(faker.commerce.price()),
      },
    });
    orders.push(order);
  }
  console.log(`${orders.length} orders created.`);

  // Create Order Items
  const orderItems = [];
  for (const order of orders) {
    const numItems = faker.number.int({ min: 1, max: 5 });
    for (let i = 0; i < numItems; i++) {
      const product = faker.helpers.arrayElement(products);
      const quantity = faker.number.int({ min: 1, max: 10 });
      const orderItem = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity,
          unitPrice: product.unitPrice,
          total: quantity * parseFloat(product.unitPrice.toString()),
        },
      });
      orderItems.push(orderItem);
    }
  }
  console.log(`${orderItems.length} order items created.`);

  // Create Deliveries
  const deliveries = [];
  for (const order of orders.filter(o => o.status === 'SHIPPED' || o.status === 'DELIVERED')) {
    const delivery = await prisma.delivery.create({
      data: {
        orderId: order.id,
        driverId: faker.helpers.arrayElement(users.filter(u => u.role === 'DRIVER')).id,
        fromLocationId: faker.helpers.arrayElement(locations).id,
        deliveryAddress: faker.location.streetAddress(),
        status: order.status === 'DELIVERED' ? 'DELIVERED' : 'IN_TRANSIT',
        scheduledDate: faker.date.future(),
      },
    });
    deliveries.push(delivery);
  }
  console.log(`${deliveries.length} deliveries created.`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
