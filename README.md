**B2PUI Project**

### Release Version : R7.4.0
- Jobs in R7a merge to master 
- Jobs in R7 merge to release-007
- Jobs in R8 merge to release-008  (Request)

**Dev Env Software requirement**
- nvm ([Node Version Manager](https://github.com/nvm-sh/nvm))
- Nodejs 11.1.0+
- PM2 `npm i -g pm2`
**Install or update nvm**

using cURL:

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
```

or Wget:

```sh
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
```

**Dev  Installation**
```sh
$ nvm install v11.1.0 // now we can use other version of node after 2019/05/01
$ git clone https://gitlab.com/mfec-ui/b2p-ui.git
$ npm install
$ npm run dev
```

**PM2 Command**
- `pm2 start ecosystem.config.js` PORT 3000 (pmm-bkchn-sit.scg.com) 
- `pm2 start ecosystem.config.js --env=sit2` PORT 3001 (pmmpa-bkchn-sit.scg.com) 
- `pm2 start ecosystem.config.js --env=seller` PORT 3002 (supplier1api-p2p-newsit.digitalventures.co.th) 
- `pm2 list` to show current process status
- `pm2 log [id]` to show log of process id (see id in `pm2 list` command)
- `pm2 log all` to see all log
- `pm2 monit` to open monitor screen
- `pm2 restart [id]` to restart process with process id specific.  (see id in `pm2 list` command)
- `pm2 restart all` to restart all current process
- `pm2 delete [id]` to delete process with process id specific.  (see id in `pm2 list` command)
- `pm2 delete all` to delete all current process
- `pm2 delete [id]` to delete process with process id specific.  (see id in `pm2 list` command)
- `pm2 delete all` to delete all current process
- `pm2 stop [id]` to stop process with process id specific.  (see id in `pm2 list` command)
- `pm2 stop all` to stop all current process
- `pm2 start [id]` to start process with process id specific.  (see id in `pm2 list` command)
- `pm2 start all` to start all current process