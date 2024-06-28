# CBP (Customs & Border Patrol)
A lightweight typescript package to check the types of arbitrary objects.

## Example Usage
```ts
import {
  objectAgent, arrayAgent, Stamped, stringAgent
} from 'cbp';

const articleAgent = objectAgent({
  title: stringAgent,
  articleSections: arrayAgent(
    objectAgent({
      heading: stringAgent,
      paragraphs: arrayAgent(stringAgent),
    }),
  ),
  imageDescription: stringAgent,
});
type Article = Stamped<typeof articleAgent>;

const getArticle = async () => {
  const response = await fetch("https://myapi.com/get-article");
  const jsonArticle = response.json();

  if (!articleAgent.canStamp(articleRaw)) {
    console.error("The API response was not a valid article");
    return;
  }
  const article: Article = articleAgent.stamp(articleRaw);
  return article;
};
```