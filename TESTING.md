# **DocumentCloud Plugin – Unit Testing Guide**

This document outlines the steps required to run unit tests for the DocumentCloud WordPress plugin. The testing suite includes both PHP unit tests for server-side functionality and JavaScript unit tests for the Gutenberg block component.

---

## **💻 Software Requirements**

To run the unit tests for this plugin, ensure you have the following software installed:

### General

* Git

* Composer

* Node.js 

* npm

### For PHP Unit Tests

* PHP

* PHPUnit (matching your PHP version)

* MySQL or MariaDB

* Subversion (`svn`)

---

## **🧪 PHP Unit Testing Setup**

The PHP unit tests use the [WordPress PHPUnit Test Suite](https://make.wordpress.org/core/handbook/testing/automated-testing/phpunit/).

### **1\. Install Dependencies**

From the root directory of the plugin, run:

```bash
composer install
```

This will install all PHP dependencies, including PHPUnit and test configuration.

### **2\. Setup WordPress Test Environment**

The WordPress test suite is already included in the repository via the script at `bin/install-wp-tests.sh`.

#### **Make the script executable:**

```bash
chmod +x bin/install-wp-tests.sh
```

#### **Run the script with appropriate parameters:**

```bash
./bin/install-wp-tests.sh <db-name> <db-user> <db-pass> [db-host] [wp-version]
```

* Replace `<db-name>`, `<db-user>`, `<db-pass>` with your local database credentials.

* ⚠️ Note: Ensure that `svn` is installed on your system, as the script uses Subversion to fetch the WordPress core files.

### **3\. Run the PHPUnit Tests**

After successful setup:

```bash
phpunit
```

To run with code coverage output:

```bash
phpunit --coverage-text
```

📌 Ensure you are running this from the plugin root and have `phpunit.xml.dist` properly configured.

---

## **🧪 Running PHPUnit Tests Inside Docker**

If you are using Docker for your development environment, follow these steps to run PHPUnit tests inside the Docker container:

### **1\. Start the Docker Containers**

```bash
docker compose up --build
```

### **2\. Open Shell into the Testing Service**

```bash
docker exec -it Testing bash
```

### **3\. Install the WordPress Test Suite**

```bash
./bin/install-wp-tests.sh test root password db latest
```

### **4\. Run the PHPUnit Tests**

```bash
./vendor/bin/phpunit
```

---

## **🧪 JavaScript Unit Testing Setup**

The Gutenberg block of this plugin is tested using [Jest](https://jestjs.io/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).

### **1\. Navigate to the Blocks Directory**

```bash
cd blocks/
```

### **2\. Install JavaScript Dependencies**

```bash
npm install
```

### **3\. Run the JS Tests**

```bash
npm run test
```

or

```bash
npx jest
```

### **4\. Test Directory Structure**

* `__tests__/` – Contains all Jest test files.

* `__mocks__/` – Includes mocks for WordPress-specific packages.

* `__snapshots__/` – Stores Jest snapshot tests, for the `save` component of the block.

⚠️ If you've made changes to how the `save` function renders content, delete existing snapshots to regenerate them:

```bash
rm -rf __snapshots__/
```