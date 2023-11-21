# flow-publish

git flow版本发布工具

- 避免手动git flow版本发布时，忘记打包生产环境代码

- 避免输错版本号

- 根据当前发布的版本分支 release/hotfix 自动生成tag版本号

- flow发布前，会自动切到develop、master拉取最新代码，保证合并代码正常, 避免在发布版本时出现合并代码时的冲突和错误

  

  ```bash
  npm i -g flow-publish
  ```

  

  

  





