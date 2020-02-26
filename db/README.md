# Database models

We use [Sequelize](https://sequelize.org/v5/) for handling model definitions along with [`sequelize-cli`](https://github.com/sequelize/cli) for handling migrations and seeders.

## Running seeders

You can run one-off seeders using the following command from the root of the project:

```shell script
npx sequelize-cli db:seed --seed db/seeders/name-of-seeder
```

Where `name-of-seeder` is the filename of the specific seeder you want to run.

## Generating new seeders

You can generate a seed file using the following command from the root of the project:

```shell script
npx sequelize-cli seed:generate --name file-name
```

This will create a file with placeholder content. This command will append a timestamp to the filename, for our purposes you can remove the timestamp before editing.
