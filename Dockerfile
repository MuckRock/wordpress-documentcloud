FROM php:8.2-cli

# Install required tools and extensions
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    curl \
    subversion \
    default-mysql-client \
    && docker-php-ext-install mysqli

# Install NPM and Node.js
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs
RUN npm install -g npm@latest

# Install Xdebug for coverage
RUN pecl install xdebug && docker-php-ext-enable xdebug

# Configure Xdebug
RUN echo "zend_extension=$(find /usr/local/lib/php/extensions/ -name xdebug.so)" > /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
    && echo "xdebug.mode=coverage" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini \
    && echo "xdebug.start_with_request=yes" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php && mv composer.phar /usr/local/bin/composer

# Set working directory
WORKDIR /var/www/html

# Install PHPUnit
RUN composer require --dev phpunit/phpunit:^9 --no-interaction

# Add composer bin directory to PATH
ENV PATH="/var/www/html/vendor/bin:${PATH}"

# Copy the local WordPress test suite installer script
COPY ./bin/install-wp-tests.sh /usr/local/bin/install-wp-tests.sh
RUN chmod +x /usr/local/bin/install-wp-tests.sh
