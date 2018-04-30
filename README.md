## My implementation of
https://gist.github.com/kevva/c180579887a1c500074d1ede97e6553d

## Disclaimer
- It uses union types (daggy) because they are great for making wrong states impossible [See this talk](https://www.youtube.com/watch?v=IcgmSRJHu_8)
- It uses "inline styles" because you avoid InnerOuterWrapper components and it's easy to change/delete
- It's not responsive or tested in other browsers than Chrome, because it was not relevant to the task
- It doesn't use Redux because it doesn't need it
- Most of the code is in one file because one should only export shared things [See this talk](https://www.youtube.com/watch?v=XpDsk374LDE)
- It has no tests because I usually don't write tests for prototypes. If you want to see some tests have a look at [react-styled](https://github.com/vikfroberg/react-styled)
