import { $, chalk, spinner } from 'zx'
import { select, input } from '@inquirer/prompts'
import { getVersion, isGitFlowInit, getCurTag, validateVersion, pullOrigin } from './utils.js'

async function publish() {
  console.log(chalk.magentaBright.bold('git flow版本发布~'))
  $.verbose = false

  try {
    // 打包生产环境
    const prod = await input({
      message: chalk.whiteBright('打包生产环境命令'),
      default: 'pnpm build:prod',
    })

    const childProcess = $.spawn(prod, [], { stdio: 'inherit', shell: true })
    await new Promise((resolve, reject) => {
      console.log(chalk.blueBright('正在打包中...'))
      childProcess.on('exit', code => {
        if (code === 0) {
          resolve()
          console.log(chalk.greenBright('生产环境打包完成√'))
        } else {
          reject(new Error(`子进程退出，退出码: ${code}`))
          console.log(chalk.redBright('生产环境打包错误,请检查!'))
        }
      })
    })

    const commit = await input({
      message: chalk.whiteBright('提交commit信息'),
      default: 'build(构建): 构建生产环境代码',
    })

    await $`git add . ;git commit -m ${commit}`

    const branchType = await select({
      message: chalk.whiteBright('请选择要发布分支'),
      choices: [
        {
          name: 'release',
          value: 'release',
        },
        {
          name: 'hotfix',
          value: 'hotfix',
        },
      ],
    })

    // 获取当前最新的tag
    const curTag = await getCurTag()
    // 版本号
    let version = await getVersion(curTag, branchType)
    while (!version) {
      version = await getVersion(curTag, branchType)
    }

    // npm版本号遵循semver规范
    while (!validateVersion(version)) {
      console.log(chalk.red('版本号请遵循语义化semver规范！'))
      version = await getVersion(curTag, branchType)
    }

    // 校验 版本号是否存在
    const { stdout: allTagStdout } = await $`git tag`
    const allTags = allTagStdout.trim().split('\n')
    while (allTags.includes(version)) {
      console.log(chalk.red(`版本号${version}已存在`))
      version = await getVersion(curTag, branchType)
    }

    // develop、master拉取最新代码，保证合并代码正常
    try {
      await pullOrigin()
      console.log(chalk.greenBright('develop、master分支代码已最新'))
    } catch (e) {
      console.log(chalk.red(`错误信息: ${e}`))
      return
    }

    if (!isGitFlowInit()) {
      try {
        // -d 选项在 git flow init 命令中表示使用默认配置进行初始化、默认选develop master
        await $`git flow init -d`
      } catch (e) {
        console.log(chalk.red(`错误信息: ${e}`))
        console.log(chalk.red(`git flow init初始化失败,请重新初始化`))
        return
      }
    }

    await spinner(chalk.greenBright(`${chalk.magentaBright.bold(version)} 版本发布中...`), async () => {
      // -m 选项并指定发布版本的信息，可以避免进入 Vim 编辑界面
      await $`git flow ${branchType} finish -m ${version} ${version}`
      try {
        await $`git push origin develop master ${version}`
        console.log('\n')
        console.log(chalk.greenBright(`发布版本完成√`))
        console.log(chalk.cyanBright(`当前版本: ${chalk.magentaBright.bold(version)}`))
      } catch (e) {
        console.log('\n')
        console.log(chalk.red(`错误信息: ${e}`))
        console.log(chalk.red(`推送远程失败,请重试  ${chalk.yellowBright(`git push origin develop master ${version}`)}  `))
        return
      }
    })
  } catch (e) {
    console.log(chalk.red(`错误信息: ${e}`))
  }
}

publish()
