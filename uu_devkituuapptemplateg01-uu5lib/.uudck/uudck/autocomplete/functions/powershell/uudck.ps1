
using namespace System.Management.Automation
using namespace System.Management.Automation.Language

$scriptblock = {
    param($WordToComplete, $CommandAst, $CursorPosition)

    $Commands =
@{
"uu5lib" = @{
"_summary" = "Manage your uu5 library. You can create new library, create components, deploy and more"
"init" = @{
"_command" = @{
  "summary" = "Generate structure of Uu5Library project"
  "flags" = @{
    "json" = @{ "summary" = "Output in JSON format instead of a human-readable format." }
    "environment" = @{ "summary" = "Select specific environment settings from the config." }
    "workDir" = @{ "summary" = "Target directory for storing script execution results." }
    "logLevel" = @{ "summary" = "Specify the logging output level." }
    "verbose" = @{ "summary" = "Enable detailed logging output." }
    "help" = @{ "summary" = "Show help for the command" }
    "localExecution" = @{ "summary" = "Toggle between local and remote execution." }
    "uuConsoleBaseUri" = @{ "summary" = "Console application used for logging and monitoring." }
    "consoleCode" = @{ "summary" = "Console component used for logging and monitoring" }
    "progressCode" = @{ "summary" = "Progress component used for tracking task execution" }
    "uuCodebaseRepositoryUri" = @{ "summary" = "Repository location in the Codebase application." }
    "targetBranch" = @{ "summary" = "Branch where changes will be committed." }
    "parentBranch" = @{ "summary" = "Parent branch for the new feature branch." }
    "sshPrivateKeyUri" = @{ "summary" = "SSH key for secure repository access." }
    "name" = @{ "summary" = "Name of the uu5library." }
    "templateVersion" = @{ "summary" = "Version of the template to use for the uu5Lib." }
  }
}
}

}

"uuhi" = @{
"_summary" = "Manage human interface of your application"
"init" = @{
"_command" = @{
  "summary" = "Generate structure of human interface for your application"
  "flags" = @{
    "json" = @{ "summary" = "Output in JSON format instead of a human-readable format." }
    "environment" = @{ "summary" = "Select specific environment settings from the config." }
    "workDir" = @{ "summary" = "Target directory for storing script execution results." }
    "logLevel" = @{ "summary" = "Specify the logging output level." }
    "verbose" = @{ "summary" = "Enable detailed logging output." }
    "help" = @{ "summary" = "Show help for the command" }
    "localExecution" = @{ "summary" = "Toggle between local and remote execution." }
    "uuConsoleBaseUri" = @{ "summary" = "Console application used for logging and monitoring." }
    "consoleCode" = @{ "summary" = "Console component used for logging and monitoring" }
    "progressCode" = @{ "summary" = "Progress component used for tracking task execution" }
    "uuCodebaseRepositoryUri" = @{ "summary" = "Repository location in the Codebase application." }
    "targetBranch" = @{ "summary" = "Branch where changes will be committed." }
    "parentBranch" = @{ "summary" = "Parent branch for the new feature branch." }
    "sshPrivateKeyUri" = @{ "summary" = "SSH key for secure repository access." }
    "name" = @{ "summary" = "Name of the project." }
    "mode" = @{ "summary" = "Specify mode. Standard mode creates uuHi for two-phase sys/uuAppWorkspace/init command." }
    "templateVersion" = @{ "summary" = "Version of the template to use for the uuHi." }
  }
}
}

}

"init" = @{
"_command" = @{
  "summary" = "Initialize uudck in the current working directory."
  "flags" = @{
    "help" = @{ "summary" = "Show help for command" }
    "uuAppDevKitEngineUri" = @{ "summary" = "URI for uuAppDevKitg02 engine. If not provided, you will be prompted interactively. If not set, you will only be able to run tasks locally on your PC." }
  }
}
}

"inspect" = @{
"_command" = @{
  "summary" = "Inspect a uuAppDevKitLib."
  "flags" = @{
    "json" = @{ "summary" = "Format output as json." }
    "help" = @{ "summary" = "Show CLI help." }
    "verbose" = @{ "summary" = " " }
  }
}
}

"inspect" = @{
"_command" = @{
  "summary" = "Inspect a uuAppDevKitLib."
  "flags" = @{
    "json" = @{ "summary" = "Format output as json." }
    "help" = @{ "summary" = "Show CLI help." }
    "verbose" = @{ "summary" = " " }
  }
}
}

"install" = @{
"_command" = @{
  "summary" = "Install a uuAppDevKitLib into uudck."
  "flags" = @{
    "json" = @{ "summary" = "Format output as json." }
    "force" = @{ "summary" = "Force npm to fetch remote resources even if a local copy exists on disk." }
    "help" = @{ "summary" = "Show CLI help." }
    "silent" = @{ "summary" = "Silences npm output." }
    "verbose" = @{ "summary" = "Show verbose npm output." }
  }
}
}

"help" = @{
"_command" = @{
  "summary" = "Display help for uudck."
  "flags" = @{
    "help" = @{ "summary" = "Show help for command" }
    "nested-commands" = @{ "summary" = "Include all nested commands in the output." }
  }
}
}

"autocomplete" = @{
"_command" = @{
  "summary" = "Display autocomplete installation instructions."
  "flags" = @{
    "help" = @{ "summary" = "Show help for command" }
    "refresh-cache" = @{ "summary" = "Refresh cache (ignores displaying instructions)" }
  }
}
}

}

    # Get the current mode
    $Mode = (Get-PSReadLineKeyHandler | Where-Object {$_.Key -eq "Tab" }).Function

    # Everything in the current line except the CLI executable name.
    $CurrentLine = $commandAst.CommandElements[1..$commandAst.CommandElements.Count] -split " "

    # Remove $WordToComplete from the current line.
    if ($WordToComplete -ne "") {
      if ($CurrentLine.Count -eq 1) {
        $CurrentLine = @()
      } else {
        $CurrentLine = $CurrentLine[0..$CurrentLine.Count]
      }
    }

    # Save flags in current line without the `--` prefix.
    $Flags = $CurrentLine | Where-Object {
      $_ -Match "^-{1,2}(\w+)"
    } | ForEach-Object {
      $_.trim("-")
    }
    # Set $flags to an empty hashtable if there are no flags in the current line.
    if ($Flags -eq $null) {
      $Flags = @{}
    }

    # No command in the current line, suggest top-level args.
    if ($CurrentLine.Count -eq 0) {
        $Commands.GetEnumerator() | Where-Object {
            $_.Key.StartsWith("$WordToComplete")
          } | Sort-Object -Property key | ForEach-Object {
          New-Object -Type CompletionResult -ArgumentList `
              $($Mode -eq "MenuComplete" ? "$($_.Key) " : "$($_.Key)"),
              $_.Key,
              "ParameterValue",
              "$($_.Value._summary ?? $_.Value._command.summary ?? " ")"
          }
    } else {
      # Start completing command/topic/coTopic

      $NextArg = $null
      $PrevNode = $null

      # Iterate over the current line to find the command/topic/coTopic hashtable
      $CurrentLine | ForEach-Object {
        if ($NextArg -eq $null) {
          $NextArg = $Commands[$_]
        } elseif ($PrevNode[$_] -ne $null) {
          $NextArg = $PrevNode[$_]
        } elseif ($_.StartsWith('-')) {
          return
        } else {
          $NextArg = $PrevNode
        }

        $PrevNode = $NextArg
      }

      # Start completing command.
      if ($NextArg._command -ne $null) {
          # Complete flags
          # `cli config list -<TAB>`
          if ($WordToComplete -like '-*') {
              $NextArg._command.flags.GetEnumerator() | Sort-Object -Property key
                  | Where-Object {
                      # Filter out already used flags (unless `flag.multiple = true`).
                      $_.Key.StartsWith("$($WordToComplete.Trim("-"))") -and ($_.Value.multiple -eq $true -or !$flags.Contains($_.Key))
                  }
                  | ForEach-Object {
                      New-Object -Type CompletionResult -ArgumentList `
                          $($Mode -eq "MenuComplete" ? "--$($_.Key) " : "--$($_.Key)"),
                          $_.Key,
                          "ParameterValue",
                          "$($NextArg._command.flags[$_.Key].summary ?? " ")"
                  }
          } else {
              # This could be a coTopic. We remove the "_command" hashtable
              # from $NextArg and check if there's a command under the current partial ID.
              $NextArg.remove("_command")

              if ($NextArg.keys -gt 0) {
                  $NextArg.GetEnumerator() | Where-Object {
                      $_.Key.StartsWith("$WordToComplete")
                    } | Sort-Object -Property key | ForEach-Object {
                    New-Object -Type CompletionResult -ArgumentList `
                      $($Mode -eq "MenuComplete" ? "$($_.Key) " : "$($_.Key)"),
                      $_.Key,
                      "ParameterValue",
                      "$($NextArg[$_.Key]._summary ?? " ")"
                  }
              }
          }
      } else {
          # Start completing topic.

          # Topic summary is stored as "_summary" in the hashtable.
          # At this stage it is no longer needed so we remove it
          # so that $NextArg contains only commands/topics hashtables

          $NextArg.remove("_summary")

          $NextArg.GetEnumerator() | Where-Object {
                $_.Key.StartsWith("$WordToComplete")
              } | Sort-Object -Property key | ForEach-Object {
              New-Object -Type CompletionResult -ArgumentList `
                  $($Mode -eq "MenuComplete" ? "$($_.Key) " : "$($_.Key)"),
                  $_.Key,
                  "ParameterValue",
                  "$($NextArg[$_.Key]._summary ?? $NextArg[$_.Key]._command.summary ?? " ")"
          }
      }
    }
}
Register-ArgumentCompleter -Native -CommandName @("uuappdevkitg02","uudck","uudck") -ScriptBlock $scriptblock
